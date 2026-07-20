import OpenAI from 'openai'
import type { ChatMessage, ContextType } from '@/types'
import {
  buildContractSystemPrompt,
  buildHistorySystemPrompt,
  buildBothSystemPrompt,
} from './prompt-templates'
import { classifyQuery } from './query-classifier'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// 1 "turn" = 1 user message + 1 assistant message = 2 messages
const TURNS_CONTRACT = 10  // last 10 turns = 20 messages
const TURNS_HISTORY  = 20  // last 20 turns = 40 messages

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

interface ChatResponse {
  content: string
  contextType: ContextType
}

export async function generateChatResponse(
  contractText: string,
  history: ChatMessage[],
  userMessage: string
): Promise<ChatResponse> {
  const contextType = classifyQuery(userMessage, history)

  let systemPrompt: string
  let historyWindow: ChatMessage[]

  if (contextType === 'HISTORY') {
    systemPrompt = buildHistorySystemPrompt()
    historyWindow = history.slice(-(TURNS_HISTORY * 2))
  } else if (contextType === 'BOTH') {
    systemPrompt = buildBothSystemPrompt(contractText)
    historyWindow = history.slice(-(TURNS_CONTRACT * 2))
  } else {
    // CONTRACT (default)
    systemPrompt = buildContractSystemPrompt(contractText)
    historyWindow = history.slice(-(TURNS_CONTRACT * 2))
  }

  const historyMessages: OpenAI.Chat.ChatCompletionMessageParam[] = historyWindow.map(
    (msg) => ({ role: msg.role, content: msg.content })
  )

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...historyMessages,
    { role: 'user', content: userMessage },
  ]

  const response = await callWithBackoff(() =>
    client.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: contextType === 'CONTRACT' ? 0.4 : 0.3,
      max_tokens: 1000,
    })
  )

  const content = response.choices[0]?.message?.content ?? 'I cannot find this in the document.'

  return { content, contextType }
}
