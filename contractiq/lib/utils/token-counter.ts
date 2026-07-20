// Uses tiktoken to count GPT-4o tokens accurately before calling OpenAI.
// Enforces the 15,000-token hard limit at upload time.

const MAX_CONTRACT_TOKENS = 15_000

export async function countTokens(text: string): Promise<number> {
  const { encoding_for_model } = await import('tiktoken')
  const enc = encoding_for_model('gpt-4o')
  const tokens = enc.encode(text)
  const count = tokens.length
  enc.free()
  return count
}

export async function validateTokenLimit(text: string): Promise<{
  tokenCount: number
  exceeded: boolean
}> {
  const tokenCount = await countTokens(text)
  return { tokenCount, exceeded: tokenCount > MAX_CONTRACT_TOKENS }
}
