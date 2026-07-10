import { createClient } from '@supabase/supabase-js'

// La "publishable key" es una llave PÚBLICA por diseño (no es un secreto):
// el acceso real está controlado por las políticas de Row Level Security (RLS)
// configuradas en Supabase, no por ocultar esta llave.
const supabaseUrl = 'https://ioonfsidjsudkjvogusg.supabase.co'
const supabaseKey = 'sb_publishable_tiy9U0eP1PTCKGyjCoAMtQ_18kLez4W'

export const supabase = createClient(supabaseUrl, supabaseKey)
