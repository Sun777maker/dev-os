import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateChatResponse } from '@/lib/ai/chat-client'
import { ERROR_CODES, ERROR_MESSAGES } from '@/lib/utils/error-codes'
import { requireAuth } from '@/lib/security/authGuard'
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rateLimiter'
import { sanitizeForLLM } from '@/lib/security/promptInjectionGuard'
import { verifyContractForChat } from '@/lib/security/chatSecurity'
import { chatMessageSchema, isValidUUID } from '@/lib/security/inputValidator'
import type { ChatMessage } from '@/types'

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

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, user_id')
    .eq('id', params.id)
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

  const { data: session } = await supabase
    .from('chat_sessions')
    .upsert(
      { contract_id: params.id, user_id: user.id },
      { onConflict: 'contract_id,user_id' }
    )
    .select('id')
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Failed to create chat session', code: 'DB_ERROR' }, { status: 500 })
  }

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id, session_id, role, content, created_at')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ sessionId: session.id, messages: messages ?? [] })
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error: authError } = await requireAuth()
  if (authError) return authError

  if (!isValidUUID(params.id)) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND, code: ERROR_CODES.CONTRACT_NOT_FOUND },
      { status: 404 }
    )
  }

  const rateError = await checkRateLimit({ userId: user.id, action: 'chat', ...RATE_LIMITS.chat })
  if (rateError) return rateError

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body', code: 'INVALID_REQUEST' }, { status: 400 })
  }

  const parsed = chatMessageSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? ERROR_MESSAGES.VALIDATION_ERROR, code: ERROR_CODES.VALIDATION_ERROR },
      { status: 422 }
    )
  }

  const { message } = parsed.data

  // Prompt injection check — must happen before any AI call
  const injection = sanitizeForLLM(message)
  if (!injection.safe) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.PROMPT_INJECTION, code: ERROR_CODES.PROMPT_INJECTION },
      { status: 400 }
    )
  }

  const supabase = createClient()

  // Verify ownership and status in one query
  const contractCheck = await verifyContractForChat(supabase, params.id, user.id)
  if (!contractCheck.allowed) {
    const isNotFound = contractCheck.reason === 'Contract not found.'
    return NextResponse.json(
      {
        error: isNotFound ? ERROR_MESSAGES.CONTRACT_NOT_FOUND : contractCheck.reason,
        code: isNotFound ? ERROR_CODES.CONTRACT_NOT_FOUND : ERROR_CODES.INVALID_STATUS,
      },
      { status: isNotFound ? 404 : 422 }
    )
  }

  const { data: session } = await supabase
    .from('chat_sessions')
    .upsert(
      { contract_id: params.id, user_id: user.id },
      { onConflict: 'contract_id,user_id' }
    )
    .select('id')
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Failed to get chat session', code: 'DB_ERROR' }, { status: 500 })
  }

  // Load history BEFORE saving the new message so the classifier sees only prior context
  const { data: historyRows } = await supabase
    .from('chat_messages')
    .select('id, session_id, role, content, created_at')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true })
    .limit(200)

  const history = (historyRows ?? []) as ChatMessage[]

  let chatResponse: { content: string; contextType: import('@/types').ContextType }
  try {
    chatResponse = await generateChatResponse(contractCheck.contractText!, history, message)
  } catch {
    return NextResponse.json(
      { error: ERROR_MESSAGES.OPENAI_TIMEOUT, code: ERROR_CODES.OPENAI_TIMEOUT },
      { status: 504 }
    )
  }

  // Insert user and assistant messages only after successful AI response
  await supabase.from('chat_messages').insert({ session_id: session.id, role: 'user', content: message })

  const { data: assistantMsg } = await supabase
    .from('chat_messages')
    .insert({ session_id: session.id, role: 'assistant', content: chatResponse.content })
    .select('id')
    .single()

  return NextResponse.json({
    response: chatResponse.content,
    contextType: chatResponse.contextType,
    sessionId: session.id,
    messageId: assistantMsg?.id ?? null,
  })
}
