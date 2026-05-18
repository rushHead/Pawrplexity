import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  return createSupabaseClient(
    "https://bkkrlerhpleiekbksdmc.supabase.co",
    process.env.SUPABASE_API_SECRET!
  )
}
