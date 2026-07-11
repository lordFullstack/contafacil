// ----------------------------------------------------------
// Capa de persistencia. Toda la app lee/escribe SOLO aquí.
// Antes usaba localStorage; ahora usa Supabase (base de datos real en la nube),
// así que TODAS las funciones son asíncronas (devuelven promesas).
// ----------------------------------------------------------
import { supabase } from './supabaseClient'
import { localDateKey, todayKey } from './dateUtils'

function mustNotError(error, context) {
  if (error) {
    console.error(`Error en ${context}:`, error)
    throw new Error(error.message || `Error en ${context}`)
  }
}
