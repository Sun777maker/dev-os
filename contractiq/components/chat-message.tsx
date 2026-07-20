import type { ReactNode } from 'react'
import type { MessageRole, ContextType } from '@/types'

interface ChatMessageProps {
  role: MessageRole
  content: string
  contextType?: ContextType
  onPageClick?: (page: number) => void
}

const SOURCE_LABELS: Record<ContextType, string> = {
  CONTRACT:  'Source: Contract',
  HISTORY:   'Source: Conversation',
  BOTH:      'Source: Contract + Conversation',
}

function renderWithPageLinks(content: string, onPageClick?: (page: number) => void): ReactNode {
  const parts = content.split(/(\[Page \d+\])/g)
  return parts.map((part, i) => {
    const match = part.match(/^\[Page (\d+)\]$/)
    if (match && onPageClick) {
      const page = parseInt(match[1], 10)
      return (
        <button
          key={i}
          type="button"
          onClick={() => onPageClick(page)}
          aria-label={`Go to page ${page}`}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--brand)',
            fontWeight: 600,
            fontSize: 'inherit',
            padding: '0 2px',
            textDecoration: 'underline',
            textDecorationStyle: 'dotted',
          }}
        >
          {part}
        </button>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export function ChatMessage({ role, content, contextType, onPageClick }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '12px',
    }}>
      <div style={{
        maxWidth: '85%',
        padding: '10px 14px',
        borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
        background: isUser ? 'var(--brand)' : 'var(--bg-surface)',
        border: isUser ? 'none' : '1px solid var(--color-grey-100)',
        fontSize: '13px',
        lineHeight: '1.6',
        color: isUser ? '#fff' : 'var(--text-primary)',
        wordBreak: 'break-word',
      }}>
        {renderWithPageLinks(content, isUser ? undefined : onPageClick)}
      </div>

      {!isUser && contextType && (
        <div style={{ marginTop: '4px', paddingLeft: '2px' }}>
          <span style={{
            display: 'inline-block',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--color-grey-100)',
            borderRadius: '4px',
            padding: '1px 6px',
            letterSpacing: '0.01em',
          }}>
            {SOURCE_LABELS[contextType]}
          </span>
        </div>
      )}
    </div>
  )
}
