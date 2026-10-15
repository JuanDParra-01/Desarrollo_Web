// OBJETIVO: identificar el proyecto de Supabase desde el navegador.
// PASO 1. Sustituye TU_PROYECTO y REEMPLAZAR por los valores públicos de tu proyecto
// (Supabase > Connect, o Settings > API Keys).
// Nunca escribas aquí el Google Client Secret, la contraseña de la base,
// una clave secret ni service_role: el código del navegador es público.
export const SUPABASE_URL = 'https://mukylfkhunindvnxxqva.supabase.co'
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_n9rN2O8_fsQsW4-v7TZNDA_FDBUDpL5'

// Devuelve true cuando ya reemplazaste ambos marcadores.
export function estaConfigurado() {
  return !SUPABASE_URL.includes('TU_PROYECTO') &&
    !SUPABASE_PUBLISHABLE_KEY.includes('REEMPLAZAR')
}
