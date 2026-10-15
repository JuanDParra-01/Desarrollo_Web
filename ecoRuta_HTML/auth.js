// OBJETIVO: iniciar sesión con Google mediante Supabase Auth (página de voluntariado).
// El SDK de Supabase se carga antes, desde el HTML, y define window.supabase.
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, estaConfigurado } from './config.js'
import { mostrarEstado } from './ui.js'

const entrar = document.querySelector('#entrar')
const salir = document.querySelector('#salir')
const estado = document.querySelector('#estado-sesion')
const usuario = document.querySelector('#usuario')

// Esta es NUESTRA página y debe coincidir con una Redirect URL permitida en Supabase.
const retorno = window.location.origin + window.location.pathname

// Solo presentación: las políticas RLS deciden los permisos reales sobre los datos.
function mostrarUsuario(persona) {
  const haySesion = Boolean(persona)
  usuario.textContent = haySesion
    ? 'Cuenta conectada: ' + (persona.email || persona.id)
    : 'Sin sesión iniciada.'
  entrar.hidden = haySesion
  salir.hidden = !haySesion

  if (!haySesion) return

  // Autocompletamos nombre y correo si el formulario está vacío.
  const campoCorreo = document.querySelector('#correo')
  const campoNombre = document.querySelector('#nombre')
  const datos = persona.user_metadata || {}
  const nombre = datos.full_name || datos.name

  if (campoCorreo && !campoCorreo.value && persona.email) campoCorreo.value = persona.email
  if (campoNombre && !campoNombre.value && nombre) campoNombre.value = nombre
}

async function iniciar() {
  // PASO 1. Comprobamos el entorno antes de intentar autenticar.
  if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') {
    mostrarEstado(estado, 'Abre esta página con Live Server, usando HTTP.', true)
    return
  }
  if (window.top !== window.self) {
    mostrarEstado(estado, 'Abre la página en una pestaña normal, fuera de un iframe.', true)
    return
  }
  if (!estaConfigurado()) {
    mostrarEstado(estado, 'Configura la URL y la clave publishable en config.js.', true)
    return
  }
  if (!window.supabase) {
    mostrarEstado(estado, 'No se cargó el SDK. Revisa la conexión y el recurso CDN.', true)
    return
  }

  // Esta dirección se registra en Supabase > Authentication > URL Configuration.
  console.info('Redirect URL para Supabase:', retorno)

  // Detectamos un rechazo del proveedor sin mostrar tokens ni la URL completa.
  const parametros = new URLSearchParams(window.location.search)
  const fragmento = new URLSearchParams(window.location.hash.slice(1))
  const errorRetorno = parametros.has('error') || fragmento.has('error')

  // PASO 2. El SDK administra el retorno OAuth y la sesión en este frontend.
  const cliente = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { flowType: 'implicit', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  })

  // PASO 3. El callback de cambios de sesión es síncrono, sin await de Auth.
  cliente.auth.onAuthStateChange(function (evento, sesion) {
    mostrarUsuario(sesion ? sesion.user : null)
    if (evento === 'SIGNED_IN') mostrarEstado(estado, 'Sesión iniciada con Supabase Auth.')
    if (evento === 'SIGNED_OUT') mostrarEstado(estado, 'La sesión se cerró en este navegador.')
  })

  // PASO 4. El botón inicia el flujo real y sus pantallas de consentimiento.
  entrar.addEventListener('click', async function () {
    entrar.disabled = true
    mostrarEstado(estado, 'Abriendo el acceso con Google...')
    try {
      const { error } = await cliente.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: retorno }
      })
      if (error) throw error
      // El navegador saldrá a Google y regresará a esta página tras el acceso.
    } catch (error) {
      console.error('No se pudo iniciar OAuth:', error.message)
      mostrarEstado(estado, 'No se pudo iniciar Google. Revisa el proveedor y las direcciones permitidas.', true)
    } finally {
      entrar.disabled = false
    }
  })

  // PASO 5. Cerramos la sesión de la aplicación solo en este navegador.
  salir.addEventListener('click', async function () {
    salir.disabled = true
    try {
      const { error } = await cliente.auth.signOut({ scope: 'local' })
      if (error) throw error
      mostrarUsuario(null)
      mostrarEstado(estado, 'Sesión cerrada en la aplicación. Tu cuenta de Google sigue existiendo.')
    } catch (error) {
      console.error('No se pudo cerrar la sesión:', error.message)
      mostrarEstado(estado, 'No se pudo cerrar la sesión. Revisa la conexión y reintenta.', true)
    } finally {
      salir.disabled = false
    }
  })

  // PASO 6. Consultamos el usuario a Auth fuera del callback de cambios.
  try {
    const { data, error } = await cliente.auth.getUser()
    if (error && error.name !== 'AuthSessionMissingError') throw error
    mostrarUsuario(data.user || null)
    if (errorRetorno) {
      mostrarEstado(estado, 'El acceso no se completó. Puedes intentarlo nuevamente.', true)
    } else {
      mostrarEstado(estado, data.user ? 'Sesión verificada con Supabase Auth.' : 'Elige Continuar con Google para acceder.')
    }
  } catch (error) {
    console.error('No se pudo comprobar la sesión:', error.message)
    mostrarEstado(estado, 'No se pudo comprobar la sesión. Revisa la conexión.', true)
  } finally {
    entrar.disabled = false
  }
}

iniciar()
// Nunca registres access_token ni refresh_token en consola, repositorio o bitácora.
