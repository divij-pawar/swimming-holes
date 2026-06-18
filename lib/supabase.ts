import { createClient } from '@supabase/supabase-js'

let _client: ReturnType<typeof createClient> | null = null

// Server-only lazy client — never import this in client components
export function getSupabase() {
  if (!_client) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
    }
    _client = createClient(url, key, { auth: { persistSession: false } })
  }
  return _client
}

// Proxy that defers client creation until first property access
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: ReturnType<typeof createClient> = new Proxy({} as ReturnType<typeof createClient>, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(_target, prop: string | symbol): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = getSupabase() as any
    return client[prop]
  },
})
