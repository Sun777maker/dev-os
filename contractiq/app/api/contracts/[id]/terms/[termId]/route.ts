import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ERROR_CODES, ERROR_MESSAGES } from '@/lib/utils/error-codes'
import { requireAuth } from '@/lib/security/authGuard'
import { termUpdateSchema, isValidUUID } from '@/lib/security/inputValidator'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; termId: string } }
) {
  const { user, error: authError } = await requireAuth()
  if (authError) return authError

  if (!isValidUUID(params.id) || !isValidUUID(params.termId)) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.TERM_NOT_FOUND, code: ERROR_CODES.TERM_NOT_FOUND },
      { status: 404 }
    )
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body', code: 'INVALID_REQUEST' }, { status: 400 })
  }

  const parsed = termUpdateSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? ERROR_MESSAGES.VALIDATION_ERROR, code: ERROR_CODES.VALIDATION_ERROR },
      { status: 422 }
    )
  }

  const { value } = parsed.data

  const supabase = createClient()

  const { data: term, error: fetchError } = await supabase
    .from('key_terms')
    .select('id, user_id, value, is_edited, original_value')
    .eq('id', params.termId)
    .eq('contract_id', params.id)
    .single()

  if (fetchError || !term) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.TERM_NOT_FOUND, code: ERROR_CODES.TERM_NOT_FOUND },
      { status: 404 }
    )
  }

  if (term.user_id !== user.id) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.FORBIDDEN, code: ERROR_CODES.FORBIDDEN },
      { status: 403 }
    )
  }

  const { data: updated } = await supabase
    .from('key_terms')
    .update({
      value: value.trim(),
      is_edited: true,
      original_value: term.is_edited ? term.original_value : term.value,
    })
    .eq('id', params.termId)
    .select('id, value, is_edited, original_value')
    .single()

  return NextResponse.json({
    id: updated?.id,
    value: updated?.value,
    isEdited: updated?.is_edited,
    originalValue: updated?.original_value,
  })
}
