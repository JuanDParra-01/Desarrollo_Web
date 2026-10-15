// OBJETIVO: funciones de interfaz compartidas por varias páginas.

// Crea un elemento con texto (textContent evita insertar HTML por error).
export function crearElemento(etiqueta, texto) {
  const elemento = document.createElement(etiqueta)
  elemento.textContent = texto
  return elemento
}

// Escribe un aviso en una zona role="status" y marca si es un error.
export function mostrarEstado(elemento, texto, esError = false) {
  elemento.textContent = texto
  elemento.classList.toggle('error', esError)
}

// Convierte un objeto "punto" en una tarjeta del DOM.
export function crearTarjeta(punto, textoEnlace, href, etiquetaTitulo = 'h2') {
  const tarjeta = document.createElement('article')
  tarjeta.className = 'punto'
  // data-id guarda el id del punto para resaltarlo o buscarlo después.
  tarjeta.dataset.id = punto.id

  const lista = document.createElement('ul')
  punto.materiales.forEach(function (material) {
    lista.append(crearElemento('li', material))
  })

  const enlace = crearElemento('a', textoEnlace)
  enlace.href = href

  tarjeta.append(
    crearElemento(etiquetaTitulo, punto.nombre),
    crearElemento('p', 'Horario: ' + punto.horario),
    crearElemento('p', 'Dirección: ' + punto.direccion),
    crearElemento('p', 'Materiales:'),
    lista,
    enlace
  )

  return tarjeta
}
