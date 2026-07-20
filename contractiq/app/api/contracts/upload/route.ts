import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractPdfText } from '@/lib/pdf/extract-text'
import { validateTokenLimit } from '@/lib/utils/token-counter'
import { ERROR_CODES, ERROR_MESSAGES } from '@/lib/utils/error-codes'
import { requireAuth } from '@/lib/security/authGuard'
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rateLimiter'
import { validateFileUpload } from '@/lib/security/inputValidator'

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireAuth()
  if (authError) return authError

  const rateError = await checkRateLimit({ userId: user.id, action: 'upload', ...RATE_LIMITS.upload })
  if (rateError) return rateError

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data', code: 'INVALID_REQUEST' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const contractType = formData.get('contractType') as string | null
  const name = formData.get('name') as string | null
  const customTermsStr = formData.get('customTerms') as string | null

  if (!file || !contractType || !name) {
    return NextResponse.json({ error: 'Missing required fields', code: 'INVALID_REQUEST' }, { status: 400 })
  }

  if (!['NDA', 'MSA'].includes(contractType)) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.VALIDATION_ERROR, code: ERROR_CODES.VALIDATION_ERROR },
      { status: 400 }
    )
  }

  if (name.length > 255) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.VALIDATION_ERROR, code: ERROR_CODES.VALIDATION_ERROR },
      { status: 400 }
    )
  }

  // Extension, MIME type, and size validation (defense-in-depth on top of storage bucket limits)
  const fileValidation = validateFileUpload(file)
  if (!fileValidation.valid) {
    return NextResponse.json(
      { error: fileValidation.error, code: ERROR_CODES.VALIDATION_ERROR },
      { status: 400 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  const extraction = await extractPdfText(buffer)
  if ('code' in extraction) {
    if (extraction.code === 'TOO_MANY_PAGES') {
      return NextResponse.json(
        { error: ERROR_MESSAGES.TOO_MANY_PAGES, code: ERROR_CODES.TOO_MANY_PAGES },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: ERROR_MESSAGES.SCANNED_PDF, code: ERROR_CODES.SCANNED_PDF },
      { status: 422 }
    )
  }

  const { text, pageCount } = extraction
  const { tokenCount, exceeded } = await validateTokenLimit(text)
  if (exceeded) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.TOKEN_LIMIT_EXCEEDED, code: ERROR_CODES.TOKEN_LIMIT_EXCEEDED },
      { status: 422 }
    )
  }

  let customTerms: string[] = []
  if (customTermsStr) {
    try {
      const parsed = JSON.parse(customTermsStr)
      if (Array.isArray(parsed)) {
        customTerms = parsed
          .slice(0, 5)
          .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
          .map((t) => t.trim().slice(0, 100))
      }
    } catch {
      // malformed customTerms ignored
    }
  }

  const supabase = createClient()

  const { data: contract, error: insertError } = await supabase
    .from('contracts')
    .insert({
      user_id: user.id,
      name,
      type: contractType,
      status: 'uploaded',
      contract_text: text,
      page_count: pageCount,
      token_count: tokenCount,
    })
    .select('id')
    .single()

  if (insertError || !contract) {
    return NextResponse.json({ error: 'Failed to create contract', code: 'DB_ERROR' }, { status: 500 })
  }

  if (customTerms.length > 0) {
    await supabase.from('custom_key_terms').insert(
      customTerms.map((termName) => ({
        contract_id: contract.id,
        user_id: user.id,
        term_name: termName,
        is_manual: true,
      }))
    )
  }

  // Non-blocking Storage upload — failure leaves file_path null; AI pipeline uses contract_text
  const filePath = `${user.id}/${contract.id}/${name}`
  try {
    const { error: storageError } = await supabase.storage
      .from('contracts')
      .upload(filePath, buffer, { contentType: 'application/pdf' })

    if (!storageError) {
      await supabase.from('contracts').update({ file_path: filePath }).eq('id', contract.id)
    }
  } catch {
    // intentionally silent — contract row is already created
  }

  return NextResponse.json(
    { contractId: contract.id, status: 'uploaded', pageCount, tokenCount },
    { status: 201 }
  )
}
