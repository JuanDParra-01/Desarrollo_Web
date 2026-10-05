import { puntos, filtrarPorCategoria, buscarPorId } from './datos.js'

// PASO 2. Encontramos las zonas de la página donde vamos a escribir.
const contenedorTarjetas = document.querySelector('#lista-puntos')
const estado = document.querySelector('#estado')
const botonesFiltro = document.querySelectorAll('.filtros button')

// Centro inicial del mapa (zona de Armenia, Quindío) y estructuras que usaremos con el mapa.
const CENTRO_INICIAL = [4.5339, -75.6811]
let mapa = null            // el mapa de Leaflet (null si Leaflet no cargó)
let capaMarcadores = null  // grupo de marcadores: se vacía y se vuelve a llenar al filtrar
let marcadoresPorId = {}   // { 1: marcador, 2: marcador... } para abrir el popup de un punto

// PASO 3. Creamos el mapa. La librería Leaflet se carga en el HTML y define la variable global L.
function iniciarMapa() {
  // Si Leaflet no cargó (sin internet, bloqueador...), avisamos y la página sigue funcionando con tarjetas.
  if (typeof L === 'undefined') {
    document.querySelector('#mapa').textContent = 'No se pudo cargar el mapa. Revisa tu conexión a internet.'
    return
  }

  mapa = L.map('mapa').setView(CENTRO_INICIAL, 12)

  // Los mosaicos (el dibujo del mapa) los entrega OpenStreetMap.
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; Colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapa)

  capaMarcadores = L.layerGroup().addTo(mapa)
}

// PASO 4. Dibujamos las tarjetas de la lista que recibimos (puede ser la colección completa o un filtro).
function mostrarTarjetas(lista) {
  // Quitamos las tarjetas anteriores para no duplicarlas al filtrar otra vez.
  contenedorTarjetas.replaceChildren()

  lista.forEach(function (punto) {
    const tarjeta = document.createElement('article')
    tarjeta.className = 'punto'
    // data-id guarda el id del punto en la tarjeta para poder resaltarla desde el mapa.
    tarjeta.dataset.id = punto.id

    const titulo = document.createElement('h2')
    titulo.textContent = punto.nombre

    const horario = document.createElement('p')
    horario.textContent = `Horario: ${punto.horario}`

    const direccion = document.createElement('p')
    direccion.textContent = `Dirección: ${punto.direccion}`

    const etiquetaMateriales = document.createElement('p')
    etiquetaMateriales.textContent = 'Materiales:'

    const listaMateriales = document.createElement('ul')
    punto.materiales.forEach(function (material) {
      const item = document.createElement('li')
      item.textContent = material
      listaMateriales.append(item)
    })

    const enlace = document.createElement('a')
    enlace.href = '#mapa'
    enlace.textContent = 'Ver en el mapa'
    enlace.addEventListener('click', function (evento) {
      // preventDefault evita el salto brusco del enlace; el desplazamiento lo hace mostrarEnMapa.
      evento.preventDefault()
      mostrarEnMapa(punto.id)
    })

    tarjeta.append(titulo, horario, direccion, etiquetaMateriales, listaMateriales, enlace)
    contenedorTarjetas.append(tarjeta)
  })
}

// PASO 5. Dibujamos un marcador por cada punto de la lista.
function mostrarMarcadores(lista) {
  if (!mapa) return

  capaMarcadores.clearLayers()
  marcadoresPorId = {}

  lista.forEach(function (punto) {
    // El contenido del popup se arma con elementos del DOM (no con texto HTML) para evitar inyecciones.
    const contenido = document.createElement('div')
    const nombre = document.createElement('strong')
    nombre.textContent = punto.nombre
    const detalle = document.createElement('p')
    detalle.textContent = `${punto.direccion} · ${punto.horario}`
    contenido.append(nombre, detalle)

    const marcador = L.marker([punto.lat, punto.lng]).bindPopup(contenido)
    // Al tocar el marcador, resaltamos la tarjeta correspondiente.
    marcador.on('click', function () {
      resaltarTarjeta(punto.id)
    })

    marcador.addTo(capaMarcadores)
    marcadoresPorId[punto.id] = marcador
  })

  // Ajustamos el zoom para que se vean todos los marcadores del filtro actual.
  if (lista.length > 0) {
    const coordenadas = lista.map(function (punto) {
      return [punto.lat, punto.lng]
    })
    mapa.fitBounds(coordenadas, { padding: [40, 40], maxZoom: 15 })
  }
}

// PASO 6. Resaltar una tarjeta (la clase seleccionado está en diseño.css).
function resaltarTarjeta(id) {
  document.querySelectorAll('.punto').forEach(function (tarjeta) {
    tarjeta.classList.toggle('seleccionado', tarjeta.dataset.id === String(id))
  })
}

// PASO 7. "Ver en el mapa": buscamos el punto con find y COMPROBAMOS el resultado antes de usarlo.
function mostrarEnMapa(id) {
  const punto = buscarPorId(puntos, id)

  if (!punto) {
    estado.textContent = 'No se encontró ese punto de reciclaje.'
    return
  }
  if (!mapa || !marcadoresPorId[id]) {
    estado.textContent = 'El mapa no está disponible en este momento.'
    return
  }

  resaltarTarjeta(id)
  document.querySelector('#mapa').scrollIntoView({ behavior: 'smooth', block: 'center' })
  mapa.setView([punto.lat, punto.lng], 16)
  marcadoresPorId[id].openPopup()
}

// PASO 8. Aplicar un filtro: una sola función actualiza botones, mensaje, tarjetas y marcadores.
function aplicarFiltro(categoria) {
  const lista = filtrarPorCategoria(puntos, categoria)

  botonesFiltro.forEach(function (boton) {
    boton.classList.toggle('activo', boton.dataset.categoria === categoria)
  })

  // Un arreglo vacío necesita un mensaje, no una lista en blanco.
  if (lista.length === 0) {
    estado.textContent = categoria === 'Todo'
      ? 'Todavía no hay puntos de reciclaje activos.'
      : `No hay puntos de reciclaje para "${categoria}".`
  } else {
    estado.textContent = `${lista.length} punto(s) de reciclaje encontrado(s).`
  }

  mostrarTarjetas(lista)
  mostrarMarcadores(lista)
}

// PASO 9. Cada botón consulta la categoría que dice su atributo data-categoria.
botonesFiltro.forEach(function (boton) {
  boton.addEventListener('click', function () {
    aplicarFiltro(boton.dataset.categoria)
  })
})

// PASO 10. Al cargar: creamos el mapa y mostramos todos los puntos antes del primer clic.
iniciarMapa()
aplicarFiltro('Todo')