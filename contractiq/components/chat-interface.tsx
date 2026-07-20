'use client'

import { useState, useEffect, useRef } from 'react'
import { ChatMessage } from '@/components/chat-message'
import { useChatHistory, useSendMessage } from '@/hooks/use-chat'

interface ChatInterfaceProps {
  contractId: string
  onPageClick?: (page: number) => void
}

const SUGGESTIONS = [
  'What are the key risks in this contract?',
  'What is the governing law?',
  'What happens if either party breaches this agreement?',
  'Summarize the payment terms.',
]

export function ChatInterface({ contractId, onPageClick }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { data: chatData, isLoading } = useChatHistory(contractId)
  const sendMessage = useSendMessage(contractId)

  const messages = chatData?.messages ?? []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, sendMessage.isPending])

  async function handleSend() {
    const text = input.trim()
    if (!text || sendMessage.isPending) return
    setInput('')
    await sendMessage.mutateAsync(text)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSuggestion(suggestion: string) {
    setInput(suggestion)
    inputRef.current?.focus()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[80, 60, 90].map((w, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end' }}>
                <div className="skeleton" style={{ height: '36px', width: `${w}%`, borderRadius: '12px' }} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', textAlign: 'center' }}>
              Ask anything about this contract. All answers are grounded in the document.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSuggestion(s)}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--color-grey-100)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                contextType={msg.contextType}
                onPageClick={onPageClick}
              />
            ))}
            {sendMessage.isPending && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '12px 12px 12px 2px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--color-grey-100)',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}>
                  Thinking…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error state */}
      {sendMessage.isError && (
        <div style={{ padding: '8px 16px', background: 'var(--color-red-50)', borderTop: '1px solid var(--color-red-200)' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-red-700)', margin: 0 }}>
            Failed to send message. Please try again.
          </p>
        </div>
      )}

      {/* Input area */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-grey-100)', background: 'var(--bg-primary)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about this contract…"
            aria-label="Chat message input"
            rows={1}
            style={{
              flex: 1,
              fontSize: '13px',
              color: 'var(--text-primary)',
              border: '1px solid var(--color-grey-200)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
              background: 'var(--bg-surface)',
              minHeight: '40px',
              maxHeight: '120px',
              overflowY: 'auto',
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            aria-label="Send message"
            className="btn-primary"
            style={{ padding: '10px 16px', flexShrink: 0 }}
          >
            ↑
          </button>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
