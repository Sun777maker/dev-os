import OpenAI from 'openai'
import type { ContractType, ExtractionResult } from '@/types'
import {
  buildExtractionSystemPrompt,
  buildExtractionUserMessage,
  JSON_RETRY_PROMPT,
} from './prompt-templates'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const MAX_RETRIES = 3
const BACKOFF_MS = [1000, 2000, 4000]

async function callWithBackoff<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt]))
      }
    }
  }
  throw lastError
}

function parseExtractionResponse(content: string): ExtractionResult[] {
  const parsed = JSON.parse(content)
  // Accept {"terms": [...]} wrapper (from json_object mode) or direct array
  const arr: unknown = Array.isArray(parsed) ? parsed : (parsed as { terms?: unknown }).terms
  if (!Array.isArray(arr)) throw new Error('Response is not an array')
  return arr as ExtractionResult[]
}

export async function extractKeyTerms(
  contractText: string,
  contractType: ContractType,
  customTerms: string[] = []
): Promise<ExtractionResult[]> {
  const systemPrompt = buildExtractionSystemPrompt(contractType)
  const userMessage = buildExtractionUserMessage(contractText, contractType, customTerms)

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ]

  const response = await callWithBackoff(() =>
    client.chat.completions.create({
      model: 'gpt-4o',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 2000,
    })
  )

  const content = response.choices[0]?.message?.content ?? ''

  // Attempt 1: direct parse
  try {
    return parseExtractionResponse(content)
  } catch {
    // Attempt 2: retry prompt
    const retryMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      ...messages,
      { role: 'assistant', content },
      { role: 'user', content: JSON_RETRY_PROMPT },
    ]

    const retryResponse = await callWithBackoff(() =>
      client.chat.completions.create({
        model: 'gpt-4o',
        messages: retryMessages,
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 2000,
      })
    )

    const retryContent = retryResponse.choices[0]?.message?.content ?? ''
    return parseExtractionResponse(retryContent)
  }
}
