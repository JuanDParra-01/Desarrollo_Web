# EcoRuta

Sitio estático (HTML + CSS + JavaScript con módulos). Los puntos de reciclaje se consultan a Supabase.

## Cómo abrirlo

1. Abre **la carpeta completa** en VS Code.
2. Clic derecho en `index.html` → **Open with Live Server**. La dirección debe empezar por `http://localhost` o `http://127.0.0.1`, nunca por `file://` (los módulos no cargan desde `file://`).

## Configurar Supabase (una sola vez)

1. Crea un proyecto de práctica en Supabase.
2. Abre **SQL Editor**, pega `supabase/puntos_reciclaje.sql` y ejecútalo. Crea la tabla, activa RLS, da solo lectura a `anon` y carga los 4 puntos.
3. Copia la URL del proyecto y la clave **publishable** (`sb_publishable_...`) en `config.js`.
   Nunca pongas ahí una clave `secret`, `service_role` ni la contraseña de la base.

Mientras `config.js` conserve los marcadores `TU_PROYECTO` / `REEMPLAZAR`, las páginas muestran el aviso
«Falta configurar Supabase» en vez de inventar datos.

## Acceso con Google (página de voluntariado)

Sigue la guía paso a paso de la clase 09 (`Guia_Paso_a_Paso_Supabase_Google_Auth.md`). Resumen:

- En Google: cliente OAuth web con el origen `http://localhost:5500` (o el tuyo) y el callback `https://TU_PROYECTO.supabase.co/auth/v1/callback`.
- En Supabase: activar Google y registrar en *Redirect URLs* la dirección exacta de `inscripcion-voluntariado.html`
  (la página la escribe en la consola del navegador como «Redirect URL para Supabase»).

## Archivos

| Archivo | Qué hace | Clase |
|---|---|---|
| `config.js` | URL y clave publishable | 09 |
| `api.js` | `consultarPuntos()`: GET con `fetch`, `async/await`, valida la estructura | 09 |
| `consultas.js` | `filtrarPorCategoria`, `buscarPorId` (`find`), `buscarPorMaterial`, `buscarPorUbicacion`, `buscarPorTermino` (`filter`) | 08 |
| `ui.js` | `crearTarjeta`, `crearElemento`, `mostrarEstado` | 07 / 08 |
| `puntos.js` | Página de puntos: mapa, filtros, búsqueda, estados, «Cerca de mí» | 08 / 09 |
| `inicio.js` | Buscador del inicio y puntos destacados | 08 / 09 |
| `app.js` | Menú activo y formularios (en todas las páginas) | 07 |
| `auth.js` | Google con Supabase Auth | 09 |
| `supabase/puntos_reciclaje.sql` | Tabla, RLS y datos | 09 |

Todos los scripts son módulos (`type="module"`); `puntos.js` e `inicio.js` importan de `api.js`, `consultas.js` y `ui.js`.

## Estados que comunica la interfaz (clase 09)

Cargando · con datos · sin datos (`[]`) · sin coincidencias del filtro · error (con botón para reintentar).

## Pendiente (clase 10)

Los formularios de «Registrar un punto» y «Voluntariado» validan y confirman en pantalla, pero todavía no guardan (POST/PATCH/DELETE).

## Pruebas sugeridas para la bitácora

- Dejar `config.js` sin configurar: aviso de configuración, sin errores en consola.
- Configurado: aparecen 4 puntos; filtrar por *Plástico* deja 2; buscar `pilas` deja 1; buscar `xyz` muestra «No hay coincidencias».
- Network (Fetch/XHR): petición GET a `/rest/v1/puntos_reciclaje?select=...&activo=eq.true...` con el encabezado `apikey` y estado 200.
- Modo offline o recurso mal escrito: mensaje de error y el botón *Actualizar puntos* sigue habilitado.
- Desde `index.html`, buscar «plástico» y abrir «Ver en el mapa»: la página de puntos abre ese punto (`?id=`).
