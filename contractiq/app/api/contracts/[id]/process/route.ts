import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractKeyTerms } from '@/lib/ai/extraction-client'
import { ERROR_CODES, ERROR_MESSAGES } from '@/lib/utils/error-codes'
import { requireAuth } from '@/lib/security/authGuard'
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rateLimiter'
import { isValidUUID } from '@/lib/security/inputValidator'
import type { ContractType } from '@/types'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error: authError } = await requireAuth()
  if (authError) return authError

  if (!isValidUUID(params.id)) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND, code: ERROR_CODES.CONTRACT_NOT_FOUND },
      { status: 404 }
    )
  }

  const rateError = await checkRateLimit({ userId: user.id, action: 'process', ...RATE_LIMITS.process })
  if (rateError) return rateError

  const supabase = createClient()

  const { data: contract, error: fetchError } = await supabase
    .from('contracts')
    .select('id, user_id, status, contract_text, type')
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

  if (contract.status === 'processed') {
    return NextResponse.json(
      { error: ERROR_MESSAGES.ALREADY_PROCESSED, code: ERROR_CODES.ALREADY_PROCESSED },
      { status: 409 }
    )
  }

  const { data: customTermsRows } = await supabase
    .from('custom_key_terms')
    .select('term_name')
    .eq('contract_id', params.id)

  const customTermNames = (customTermsRows ?? []).map((r) => r.term_name)

  await supabase.from('contracts').update({ status: 'processing' }).eq('id', params.id)

  let extractedTerms: Awaited<ReturnType<typeof extractKeyTerms>>
  try {
    extractedTerms = await extractKeyTerms(
      contract.contract_text!,
      contract.type as ContractType,
      customTermNames
    )
  } catch (err) {
    await supabase.from('contracts').update({ status: 'error' }).eq('id', params.id)
    const isParseFailure =
      err instanceof SyntaxError ||
      (err instanceof Error && err.message === 'Response is not an array')
    if (isParseFailure) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.OPENAI_PARSE_FAILURE, code: ERROR_CODES.OPENAI_PARSE_FAILURE },
        { status: 422 }
      )
    }
    return NextResponse.json(
      { error: ERROR_MESSAGES.OPENAI_TIMEOUT, code: ERROR_CODES.OPENAI_TIMEOUT },
      { status: 504 }
    )
  }

  await supabase.from('key_terms').insert(
    extractedTerms.map((term) => ({
      contract_id: params.id,
      user_id: user.id,
      term_name: term.term_name,
      value: term.value,
      page_number: term.page_number,
      confidence_score: term.confidence_score,
      source_sentence: term.source_sentence,
      is_custom: customTermNames.includes(term.term_name),
    }))
  )

  await supabase.from('contracts').update({ status: 'processed' }).eq('id', params.id)

  return NextResponse.json({ status: 'processed', termCount: extractedTerms.length })
}
