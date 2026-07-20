import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

interface RateLimitConfig {
  userId: string
  action: string
  maxRequests: number
  windowSeconds: number
}

// Returns a 429 NextResponse if the limit is exceeded, otherwise null.
// All reads/writes use the service-role client so users cannot manipulate their own counts.
export async function checkRateLimit(config: RateLimitConfig): Promise<NextResponse | null> {
  const { userId, action, maxRequests, windowSeconds } = config
  const supabase = createAdminClient()
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString()

  const { count } = await supabase
    .from('rate_limit_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', windowStart)

  if ((count ?? 0) >= maxRequests) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.', code: 'RATE_LIMITED' },
      {
        status: 429,
        headers: { 'Retry-After': String(windowSeconds) },
      }
    )
  }

  await supabase.from('rate_limit_events').insert({ user_id: userId, action })

  return null
}

export const RATE_LIMITS = {
  upload:  { maxRequests: 20, windowSeconds: 86_400 },  // 20 uploads / day
  process: { maxRequests:  5, windowSeconds:  3_600 },  // 5 extractions / hour
  chat:    { maxRequests: 30, windowSeconds:     60 },  // 30 messages / minute
} as const
