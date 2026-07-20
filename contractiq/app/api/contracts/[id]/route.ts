import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ERROR_CODES, ERROR_MESSAGES } from '@/lib/utils/error-codes'
import { requireAuth } from '@/lib/security/authGuard'
import { isValidUUID } from '@/lib/security/inputValidator'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error: authError } = await requireAuth()
  if (authError) return authError

  if (!isValidUUID(params.id)) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND, code: ERROR_CODES.CONTRACT_NOT_FOUND },
      { status: 404 }
    )
  }

  const supabase = createClient()

  const { data: contract, error: fetchError } = await supabase
    .from('contracts')
    .select('id, user_id, name, type, status, file_path, page_count, token_count, created_at, updated_at')
    .eq('id', params.id)
    .single()

  if (fetchError || !contract) {
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

  const { data: keyTerms } = await supabase
    .from('key_terms')
    .select('id, contract_id, user_id, term_name, value, page_number, confidence_score, source_sentence, is_custom, is_edited, original_value, created_at')
    .eq('contract_id', params.id)
    .order('created_at', { ascending: true })

  let signedUrl: string | null = null
  if (contract.file_path) {
    const { data: urlData } = await supabase.storage
      .from('contracts')
      .createSignedUrl(contract.file_path, 3600)
    signedUrl = urlData?.signedUrl ?? null
  }

  return NextResponse.json({
    contract: {
      id: contract.id,
      user_id: contract.user_id,
      name: contract.name,
      type: contract.type,
      status: contract.status,
      file_path: contract.file_path,
      page_count: contract.page_count,
      token_count: contract.token_count,
      created_at: contract.created_at,
      updated_at: contract.updated_at,
    },
    keyTerms: keyTerms ?? [],
    signedUrl,
  })
}
