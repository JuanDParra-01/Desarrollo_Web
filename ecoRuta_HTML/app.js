// OBJETIVO: comportamiento compartido por todas las páginas (menú y formularios).
// Se carga con type="module", así que corre cuando el HTML ya está leído.

// PASO 1. Resaltar el enlace del menú que corresponde a la página actual.
const paginaActual = window.location.pathname.split('/').pop() || 'index.html'

document.querySelectorAll('header nav div a').forEach(function (enlace) {
  if (enlace.getAttribute('href') === paginaActual) {
    enlace.classList.add('activo')
    enlace.setAttribute('aria-current', 'page')
  }
})

// PASO 2. Formularios: validar, confirmar en pantalla y limpiar.
// Todavía no se guardan en Supabase (escribir registros es la clase 10).
document.querySelectorAll('form').forEach(function (formulario) {
  // El buscador del inicio lo maneja inicio.js.
  if (formulario.id === 'form-busqueda') return

  const aviso = document.createElement('p')
  aviso.setAttribute('role', 'status')
  aviso.hidden = true
  formulario.append(aviso)

  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault()
    formulario.reset()
    aviso.textContent = 'Datos recibidos. Por ahora el envío es de prueba: todavía no se guardan en el servidor.'
    aviso.hidden = false
  })
})
