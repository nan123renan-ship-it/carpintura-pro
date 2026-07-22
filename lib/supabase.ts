import { createClient } from '@supabase/supabase-js'

// Variáveis de ambiente já configuradas no sandbox
const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
