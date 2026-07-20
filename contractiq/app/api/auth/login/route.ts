import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body', code: 'INVALID_REQUEST' }, { status: 400 })
  }

  const parsed = loginSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Validation failed', code: 'VALIDATION_ERROR' },
      { status: 422 }
    )
  }

  const { email, password } = parsed.data
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    // Return a generic error — do not reveal whether the email exists
    return NextResponse.json(
      { error: 'Invalid email or password.', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  return NextResponse.json({ userId: data.user.id })
}
