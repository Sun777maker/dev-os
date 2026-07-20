import { createClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS. Never expose to the browser.
// Only used server-side (rate limiter, admin operations).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase admin credentials are not configured.')
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
