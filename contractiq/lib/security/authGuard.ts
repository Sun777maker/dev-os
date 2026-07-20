import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'

type AuthResult =
  | { user: User; error: null }
  | { user: null; error: NextResponse }

export async function requireAuth(): Promise<AuthResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'You must be signed in to perform this action.', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    }
  }

  return { user, error: null }
}
