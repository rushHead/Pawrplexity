import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    "https://bkkrlerhpleiekbksdmc.supabase.co",
    "sb_publishable_OXBNE69NzXXk0ldwcoXfwQ_czVnUaKu"
  )
}
