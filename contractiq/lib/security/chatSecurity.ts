import type { SupabaseClient } from '@supabase/supabase-js'

interface ContractCheckResult {
  allowed: boolean
  contractText?: string
  reason?: string
}

// Verifies that the user owns the contract AND it is fully processed.
// Returns contractText so the caller doesn't need a second DB round-trip.
export async function verifyContractForChat(
  supabase: SupabaseClient,
  contractId: string,
  userId: string
): Promise<ContractCheckResult> {
  const { data: contract } = await supabase
    .from('contracts')
    .select('id, user_id, status, contract_text')
    .eq('id', contractId)
    .single()

  if (!contract) {
    return { allowed: false, reason: 'Contract not found.' }
  }

  if (contract.user_id !== userId) {
    return { allowed: false, reason: 'Access denied.' }
  }

  if (contract.status !== 'processed') {
    return { allowed: false, reason: 'Contract must be fully processed before chatting.' }
  }

  return { allowed: true, contractText: contract.contract_text ?? '' }
}

// Verifies that a chat session belongs to the given user.
export async function verifySessionOwnership(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<boolean> {
  const { data: session } = await supabase
    .from('chat_sessions')
    .select('user_id')
    .eq('id', sessionId)
    .single()

  return session?.user_id === userId
}
