// OBJETIVO: funciones que consultan una colección de puntos (find y filter).
// Reciben el arreglo que entregó api.js; no tocan el DOM ni piden datos.

// Minúsculas, sin espacios en los extremos y sin tildes: "Plástico" coincide con "plastico".
export function normalizarTexto(texto) {
  return String(texto).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// Devuelve TODOS los puntos activos que acepten la categoría.
// 'Todo' es el botón que quita el filtro. filter siempre devuelve un arreglo ([] si nada coincide).
export function filtrarPorCategoria(coleccion, categoria) {
  return coleccion.filter(function (punto) {
    if (!punto.activo) return false
    return categoria === 'Todo' || punto.categorias.includes(categoria)
  })
}

// Devuelve el punto con ese id, o undefined si no existe.
// Quien llame debe comprobar el resultado antes de usar sus propiedades.
export function buscarPorId(coleccion, id) {
  return coleccion.find(function (punto) {
    return punto.id === id
  })
}

// Puntos cuyo material o categoría contiene el texto. Texto vacío = no filtra.
export function buscarPorMaterial(coleccion, texto) {
  const termino = normalizarTexto(texto)
  if (termino === '') return coleccion

  return coleccion.filter(function (punto) {
    return punto.materiales.concat(punto.categorias).some(function (material) {
      return normalizarTexto(material).includes(termino)
    })
  })
}

// Puntos cuyo nombre o dirección contiene el texto. Texto vacío = no filtra.
export function buscarPorUbicacion(coleccion, texto) {
  const termino = normalizarTexto(texto)
  if (termino === '') return coleccion

  return coleccion.filter(function (punto) {
    return normalizarTexto(punto.nombre).includes(termino) ||
      normalizarTexto(punto.direccion).includes(termino)
  })
}

// Búsqueda libre de la página de puntos: nombre, dirección o material.
export function buscarPorTermino(coleccion, texto) {
  const termino = normalizarTexto(texto)
  if (termino === '') return coleccion

  return coleccion.filter(function (punto) {
    const campos = [punto.nombre, punto.direccion].concat(punto.materiales)
    return campos.some(function (campo) {
      return normalizarTexto(campo).includes(termino)
    })
  })
}
