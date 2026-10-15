// OBJETIVO: página de inicio. Consulta la API una vez, muestra los puntos destacados
// y filtra esa colección descargada cuando la persona usa el buscador.
import { consultarPuntos } from './api.js'
import { estaConfigurado } from './config.js'
import { buscarPorMaterial, buscarPorUbicacion } from './consultas.js'
import { crearTarjeta, mostrarEstado } from './ui.js'

const formBusqueda = document.querySelector('#form-busqueda')
const botonBuscar = formBusqueda.querySelector('button[type="submit"]')
const panelResultados = document.querySelector('#resultados-busqueda')
const mensajeBusqueda = document.querySelector('#mensaje-busqueda')
const listaBusqueda = document.querySelector('#lista-busqueda')
const estadoDestacados = document.querySelector('#destacados-estado')
const listaDestacados = document.querySelector('#lista-destacados')

let puntosCargados = []
let cargaCorrecta = false

// Muestra los dos primeros puntos activos como destacados.
function mostrarDestacados() {
  listaDestacados.replaceChildren()

  if (puntosCargados.length === 0) {
    mostrarEstado(estadoDestacados, 'Todavía no hay puntos activos.')
    return
  }

  mostrarEstado(estadoDestacados, '')
  puntosCargados.slice(0, 2).forEach(function (punto) {
    const enlace = 'puntos-reciclaje.html?id=' + punto.id
    listaDestacados.append(crearTarjeta(punto, 'Ver detalles', enlace, 'h3'))
  })
}

// Ciclo de la consulta: cargando -> éxito o error.
async function cargarPuntos() {
  cargaCorrecta = false
  botonBuscar.disabled = true
  listaDestacados.setAttribute('aria-busy', 'true')
  mostrarEstado(estadoDestacados, 'Cargando puntos...')

  try {
    puntosCargados = await consultarPuntos()
    cargaCorrecta = true
    mostrarDestacados()
  } catch (error) {
    console.error('Error al consultar los puntos:', error)
    listaDestacados.replaceChildren()
    const mensaje = estaConfigurado()
      ? 'No se pudieron cargar los puntos. Intenta de nuevo en un momento.'
      : 'Falta configurar Supabase en config.js (URL y clave publishable).'
    mostrarEstado(estadoDestacados, mensaje, true)
  } finally {
    botonBuscar.disabled = false
    listaDestacados.setAttribute('aria-busy', 'false')
  }
}

// Buscador: filtra los puntos ya descargados (sin pedir datos en cada búsqueda).
formBusqueda.addEventListener('submit', async function (evento) {
  evento.preventDefault()

  const material = document.querySelector('#material').value
  const ubicacion = document.querySelector('#ubicacion').value

  panelResultados.hidden = false
  listaBusqueda.replaceChildren()

  if (material.trim() === '' && ubicacion.trim() === '') {
    mostrarEstado(mensajeBusqueda, 'Escribe un material o una zona para buscar.')
    return
  }

  // Si la primera consulta falló, la reintentamos antes de buscar.
  if (!cargaCorrecta) {
    mostrarEstado(mensajeBusqueda, 'Cargando puntos...')
    await cargarPuntos()
  }
  if (!cargaCorrecta) {
    mostrarEstado(mensajeBusqueda, 'No pudimos consultar los puntos. Intenta de nuevo en un momento.', true)
    return
  }

  let resultado = buscarPorMaterial(puntosCargados, material)
  resultado = buscarPorUbicacion(resultado, ubicacion)

  if (resultado.length === 0) {
    mostrarEstado(mensajeBusqueda, 'No encontramos puntos con esos datos. Prueba con otro material.')
    return
  }

  mostrarEstado(mensajeBusqueda, resultado.length + ' punto(s) encontrado(s).')

  resultado.forEach(function (punto) {
    const enlace = 'puntos-reciclaje.html?id=' + punto.id
    listaBusqueda.append(crearTarjeta(punto, 'Ver en el mapa', enlace))
  })

  panelResultados.scrollIntoView({ behavior: 'smooth', block: 'start' })
})

cargarPuntos()
