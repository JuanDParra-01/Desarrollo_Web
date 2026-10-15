// OBJETIVO: obtener los puntos de reciclaje desde Supabase sin mezclar la consulta con el DOM.
// Las páginas importan consultarPuntos y esperan su resultado con await.
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, estaConfigurado } from './config.js'

// Comprueba que un registro tenga los campos y tipos que usa la interfaz.
function esPuntoValido(punto) {
  return punto !== null && typeof punto === 'object' &&
    Number.isInteger(punto.id) &&
    typeof punto.nombre === 'string' &&
    typeof punto.direccion === 'string' &&
    typeof punto.horario === 'string' &&
    Array.isArray(punto.materiales) &&
    Array.isArray(punto.categorias) &&
    typeof punto.lat === 'number' &&
    typeof punto.lng === 'number' &&
    typeof punto.activo === 'boolean'
}

export async function consultarPuntos() {
  // Evitamos una petición que sabemos que todavía no está configurada.
  if (!estaConfigurado()) {
    throw new Error('Configura tu URL y tu clave publishable en config.js.')
  }

  // PASO 1. Preparamos el recurso y sus parámetros con URL y searchParams.
  const url = new URL('/rest/v1/puntos_reciclaje', SUPABASE_URL)
  url.searchParams.set('select', 'id,nombre,direccion,horario,materiales,categorias,lat,lng,activo')
  url.searchParams.set('activo', 'eq.true')
  url.searchParams.set('order', 'id.asc')
  url.searchParams.set('limit', '50')

  // PASO 2. Esperamos la respuesta HTTP. Todavía no es el arreglo de puntos.
  const respuesta = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Accept: 'application/json'
    }
  })

  // Un HTTP 4xx o 5xx no hace que fetch lance un error por sí solo.
  if (!respuesta.ok) {
    throw new Error('La API respondió con estado HTTP ' + respuesta.status)
  }

  // PASO 3. Leemos y convertimos el cuerpo JSON.
  const datos = await respuesta.json()

  // PASO 4. Comprobamos la estructura en vez de asumirla. [] sigue siendo válido.
  if (!Array.isArray(datos)) {
    throw new Error('Se esperaba una colección de puntos.')
  }
  if (!datos.every(esPuntoValido)) {
    throw new Error('Los campos recibidos no coinciden con los de puntos_reciclaje.')
  }

  // PASO 5. Entregamos solo los datos. Cada página decide cómo mostrarlos.
  return datos
}
