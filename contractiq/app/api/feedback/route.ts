import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ERROR_CODES, ERROR_MESSAGES } from '@/lib/utils/error-codes'
import { requireAuth } from '@/lib/security/authGuard'
import { feedbackSchema } from '@/lib/security/inputValidator'

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireAuth()
  if (authError) return authError

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body', code: 'INVALID_REQUEST' }, { status: 400 })
  }

  const parsed = feedbackSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? ERROR_MESSAGES.VALIDATION_ERROR, code: ERROR_CODES.VALIDATION_ERROR },
      { status: 422 }
    )
  }

  const { contractId, rating, comment } = parsed.data

  const supabase = createClient()

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, user_id')
    .eq('id', contractId)
    .single()

  if (!contract) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND, code: ERROR_CODES.CONTRACT_NOT_FOUND },
      { status: 404 }
    )
  }

  if (contract.user_id !== user.id) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.FORBIDDEN, code: ERROR_CODES.FORBIDDEN },
      { status: 403 }
    )
  }

  const { data: feedback } = await supabase
    .from('user_feedback')
    .upsert(
      {
        contract_id: contractId,
        user_id: user.id,
        rating,
        comment: comment ?? null,
      },
      { onConflict: 'contract_id,user_id' }
    )
    .select('id')
    .single()

  return NextResponse.json({ id: feedback?.id }, { status: 201 })
}
