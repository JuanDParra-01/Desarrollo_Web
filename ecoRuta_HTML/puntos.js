// OBJETIVO: página "Puntos de reciclaje". Consulta la API, dibuja tarjetas y mapa
// y comunica los cinco estados: cargando, éxito, vacío, sin coincidencias y error.
import { consultarPuntos } from './api.js'
import { estaConfigurado } from './config.js'
import { filtrarPorCategoria, buscarPorId, buscarPorTermino } from './consultas.js'
import { crearTarjeta, mostrarEstado } from './ui.js'

// PASO 1. Encontramos las zonas de la página donde vamos a escribir.
const contenedorTarjetas = document.querySelector('#lista-puntos')
const estado = document.querySelector('#estado')
const campoBusqueda = document.querySelector('#busqueda')
const botonRecargar = document.querySelector('#recargar')
const botonUbicacion = document.querySelector('#btn-ubicacion')
const botonesFiltro = document.querySelectorAll('.filtros button')

// Centro inicial del mapa (Armenia, Quindío).
const CENTRO_INICIAL = [4.5339, -75.6811]

let mapa = null            // el mapa de Leaflet (null si Leaflet no cargó)
let capaMarcadores = null  // grupo de marcadores que se vacía y se llena al filtrar
let marcadoresPorId = {}   // { 1: marcador, 2: marcador... }
let marcadorUsuario = null // círculo "Tú estás aquí"

let puntosCargados = []    // copia temporal de lo que devolvió la API
let visibles = []          // puntos que pasan el filtro y la búsqueda actuales
let categoriaActual = 'Todo'
let cargaCorrecta = false  // false mientras carga o si la consulta falló

// PASO 2. Creamos el mapa. Leaflet define la variable global L.
function iniciarMapa() {
  if (typeof L === 'undefined') {
    document.querySelector('#mapa').textContent = 'No se pudo cargar el mapa. Revisa tu conexión a internet.'
    return
  }

  mapa = L.map('mapa').setView(CENTRO_INICIAL, 12)

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; Colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapa)

  capaMarcadores = L.layerGroup().addTo(mapa)
}

// PASO 3. Dibujamos las tarjetas de la lista que recibimos.
function mostrarTarjetas(lista) {
  contenedorTarjetas.replaceChildren()

  lista.forEach(function (punto) {
    contenedorTarjetas.append(crearTarjeta(punto, 'Ver en el mapa', '#mapa'))
  })
}

// PASO 4. Un marcador por cada punto de la lista.
function mostrarMarcadores(lista) {
  if (!mapa) return

  capaMarcadores.clearLayers()
  marcadoresPorId = {}

  lista.forEach(function (punto) {
    // El popup se arma con elementos del DOM (no con HTML) para evitar inyecciones.
    const contenido = document.createElement('div')
    const nombre = document.createElement('strong')
    nombre.textContent = punto.nombre
    const detalle = document.createElement('p')
    detalle.textContent = punto.direccion + ' · ' + punto.horario
    contenido.append(nombre, detalle)

    const marcador = L.marker([punto.lat, punto.lng]).bindPopup(contenido)
    marcador.on('click', function () {
      resaltarTarjeta(punto.id)
    })

    marcador.addTo(capaMarcadores)
    marcadoresPorId[punto.id] = marcador
  })

  if (lista.length > 0) {
    const coordenadas = lista.map(function (punto) {
      return [punto.lat, punto.lng]
    })
    mapa.fitBounds(coordenadas, { padding: [40, 40], maxZoom: 15 })
  }
}

// PASO 5. Resaltar una tarjeta (la clase seleccionado está en diseño.css).
function resaltarTarjeta(id) {
  document.querySelectorAll('.punto').forEach(function (tarjeta) {
    tarjeta.classList.toggle('seleccionado', tarjeta.dataset.id === String(id))
  })
}

// PASO 6. Aplicar filtro de categoría + búsqueda y redibujar todo.
function aplicarFiltros() {
  const porCategoria = filtrarPorCategoria(puntosCargados, categoriaActual)
  visibles = buscarPorTermino(porCategoria, campoBusqueda.value)

  botonesFiltro.forEach(function (boton) {
    const activo = boton.dataset.categoria === categoriaActual
    boton.classList.toggle('activo', activo)
    boton.setAttribute('aria-pressed', String(activo))
  })

  // Cada situación tiene su propio mensaje.
  if (puntosCargados.length === 0) {
    mostrarEstado(estado, 'La consulta no devolvió puntos de reciclaje activos.')
  } else if (visibles.length === 0) {
    mostrarEstado(estado, 'No hay coincidencias entre los puntos cargados. Cambia el material o la búsqueda.')
  } else {
    mostrarEstado(estado, 'Mostrando ' + visibles.length + ' de ' + puntosCargados.length + ' puntos cargados.')
  }

  mostrarTarjetas(visibles)
  mostrarMarcadores(visibles)
}

// PASO 7. "Ver en el mapa": find + comprobación del resultado antes de usarlo.
function mostrarEnMapa(id) {
  const punto = buscarPorId(puntosCargados, id)

  if (!punto) {
    mostrarEstado(estado, 'No se encontró ese punto de reciclaje.', true)
    return
  }
  if (!mapa) {
    mostrarEstado(estado, 'El mapa no está disponible en este momento.', true)
    return
  }

  // Si el filtro actual lo oculta, quitamos los filtros para poder mostrarlo.
  if (!marcadoresPorId[id]) {
    categoriaActual = 'Todo'
    campoBusqueda.value = ''
    aplicarFiltros()
  }

  resaltarTarjeta(id)
  document.querySelector('#mapa').scrollIntoView({ behavior: 'smooth', block: 'center' })
  mapa.setView([punto.lat, punto.lng], 16)
  marcadoresPorId[id].openPopup()
}

// Si venimos del buscador del inicio (?id=3), abrimos ese punto.
function abrirPuntoDeLaUrl() {
  const idEnUrl = new URLSearchParams(window.location.search).get('id')
  if (idEnUrl === null) return

  const id = Number(idEnUrl)
  if (!Number.isInteger(id)) {
    mostrarEstado(estado, 'El enlace no trae un punto válido.', true)
    return
  }
  mostrarEnMapa(id)
}

// PASO 8. Ciclo completo de una consulta: cargando -> éxito o error.
async function cargarPuntos() {
  cargaCorrecta = false
  botonRecargar.disabled = true
  campoBusqueda.disabled = true
  botonUbicacion.disabled = true
  contenedorTarjetas.setAttribute('aria-busy', 'true')

  puntosCargados = []
  visibles = []
  contenedorTarjetas.replaceChildren()
  if (capaMarcadores) capaMarcadores.clearLayers()
  mostrarEstado(estado, 'Cargando puntos de reciclaje...')

  try {
    // Aquí esperamos el arreglo; mientras tanto la página sigue respondiendo.
    puntosCargados = await consultarPuntos()
    cargaCorrecta = true

    aplicarFiltros()
    campoBusqueda.disabled = false
    botonUbicacion.disabled = false
    abrirPuntoDeLaUrl()
  } catch (error) {
    // El detalle técnico queda en consola; la persona recibe un aviso y puede reintentar.
    console.error('Error al consultar los puntos:', error)
    if (estaConfigurado()) {
      mostrarEstado(estado, 'No se pudieron cargar los puntos. Revisa tu conexión y pulsa Actualizar puntos.', true)
    } else {
      mostrarEstado(estado, 'Falta configurar Supabase en config.js (URL y clave publishable).', true)
    }
  } finally {
    // Ocurre después del éxito y después del error: el botón nunca queda bloqueado.
    botonRecargar.disabled = false
    contenedorTarjetas.setAttribute('aria-busy', 'false')
  }
}

// PASO 9. Eventos.
botonesFiltro.forEach(function (boton) {
  boton.addEventListener('click', function () {
    if (!cargaCorrecta) return
    categoriaActual = boton.dataset.categoria
    aplicarFiltros()
  })
})

campoBusqueda.addEventListener('input', function () {
  if (!cargaCorrecta) return
  aplicarFiltros()
})

botonRecargar.addEventListener('click', cargarPuntos)

// Clic en "Ver en el mapa" de cualquier tarjeta (delegación de eventos).
contenedorTarjetas.addEventListener('click', function (evento) {
  const enlace = evento.target.closest('a')
  if (!enlace) return

  evento.preventDefault()
  mostrarEnMapa(Number(enlace.closest('.punto').dataset.id))
})

// "Cerca de mí": distancia a cada punto visible y elige el menor.
botonUbicacion.addEventListener('click', function () {
  if (!mapa) {
    mostrarEstado(estado, 'Necesitas el mapa cargado para usar esta opción.', true)
    return
  }
  if (!navigator.geolocation) {
    mostrarEstado(estado, 'Tu navegador no permite obtener la ubicación.', true)
    return
  }
  if (visibles.length === 0) {
    mostrarEstado(estado, 'No hay puntos visibles para comparar.', true)
    return
  }

  mostrarEstado(estado, 'Buscando tu ubicación...')

  navigator.geolocation.getCurrentPosition(
    function (posicion) {
      const usuario = L.latLng(posicion.coords.latitude, posicion.coords.longitude)

      if (marcadorUsuario) marcadorUsuario.remove()
      marcadorUsuario = L.circleMarker(usuario, {
        radius: 9, color: '#1b4332', fillColor: '#a5d0b9', fillOpacity: 1
      }).addTo(mapa).bindPopup('Tú estás aquí')

      // map: una distancia por cada punto visible.
      const distancias = visibles.map(function (punto) {
        return { punto: punto, metros: mapa.distance(usuario, [punto.lat, punto.lng]) }
      })

      let masCercano = distancias[0]
      distancias.forEach(function (item) {
        if (item.metros < masCercano.metros) masCercano = item
      })

      const km = (masCercano.metros / 1000).toFixed(1)
      mostrarEstado(estado, 'El punto más cercano es ' + masCercano.punto.nombre + ' (a ' + km + ' km).')

      mapa.fitBounds([usuario, [masCercano.punto.lat, masCercano.punto.lng]], { padding: [60, 60] })
      resaltarTarjeta(masCercano.punto.id)
      marcadoresPorId[masCercano.punto.id].openPopup()
    },
    function () {
      mostrarEstado(estado, 'No pudimos obtener tu ubicación. Revisa los permisos del navegador.', true)
    }
  )
})

// PASO 10. Al cargar: creamos el mapa y pedimos los puntos.
iniciarMapa()
cargarPuntos()
