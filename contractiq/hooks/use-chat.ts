'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ChatMessage, ContextType } from '@/types'

interface ChatHistory {
  sessionId: string
  messages: ChatMessage[]
}

interface SendMessageResponse {
  response: string
  contextType: ContextType
  sessionId: string
  messageId: string
}

export function useChatHistory(contractId: string) {
  return useQuery<ChatHistory>({
    queryKey: ['chat', contractId],
    queryFn: async () => {
      const res = await fetch(`/api/contracts/${contractId}/chat`)
      if (!res.ok) throw new Error('Failed to load chat history')
      return res.json()
    },
    enabled: !!contractId,
  })
}

export function useSendMessage(contractId: string) {
  const queryClient = useQueryClient()

  return useMutation<SendMessageResponse, Error, string>({
    mutationFn: async (message: string) => {
      const res = await fetch(`/api/contracts/${contractId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      if (!res.ok) throw new Error('Failed to send message')
      return res.json()
    },
    onSuccess: (data, userMessage) => {
      // Manually update cache instead of refetching so contextType is preserved.
      // Messages from GET (DB) never carry contextType; only POST responses do.
      queryClient.setQueryData<ChatHistory>(['chat', contractId], (old) => {
        if (!old) return old

        const userMsg: ChatMessage = {
          id: crypto.randomUUID(),
          session_id: old.sessionId,
          role: 'user',
          content: userMessage,
          created_at: new Date().toISOString(),
        }

        const assistantMsg: ChatMessage = {
          id: data.messageId,
          session_id: old.sessionId,
          role: 'assistant',
          content: data.response,
          created_at: new Date().toISOString(),
          contextType: data.contextType,
        }

        return {
          ...old,
          messages: [...old.messages, userMsg, assistantMsg],
        }
      })
    },
  })
}
