'use client'

import { useState } from 'react'
import type { FeedbackRating } from '@/types'

interface FeedbackWidgetProps {
  contractId: string
}

export function FeedbackWidget({ contractId }: FeedbackWidgetProps) {
  const [rating, setRating] = useState<FeedbackRating | null>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!rating) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, rating, comment: comment.trim() || undefined }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Submission failed')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--color-grey-100)',
        background: 'var(--color-green-50)',
        borderRadius: '0 0 8px 8px',
      }}>
        <p style={{ fontSize: '13px', color: 'var(--color-green-700)', textAlign: 'center', margin: 0 }}>
          ✓ Thank you for your feedback
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-grey-100)', background: 'var(--bg-primary)' }}>
      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Was this review helpful?
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: rating ? '12px' : '0' }}>
        <button
          type="button"
          onClick={() => setRating('thumbs_up')}
          aria-label="Thumbs up — review was helpful"
          aria-pressed={rating === 'thumbs_up'}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: `1px solid ${rating === 'thumbs_up' ? 'var(--color-green-500)' : 'var(--color-grey-200)'}`,
            background: rating === 'thumbs_up' ? 'var(--color-green-50)' : 'transparent',
            cursor: 'pointer',
            fontSize: '18px',
          }}
        >
          👍
        </button>
        <button
          type="button"
          onClick={() => setRating('thumbs_down')}
          aria-label="Thumbs down — review was not helpful"
          aria-pressed={rating === 'thumbs_down'}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: `1px solid ${rating === 'thumbs_down' ? 'var(--color-red-500)' : 'var(--color-grey-200)'}`,
            background: rating === 'thumbs_down' ? 'var(--color-red-50)' : 'transparent',
            cursor: 'pointer',
            fontSize: '18px',
          }}
        >
          👎
        </button>
      </div>

      {rating && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional comment…"
            aria-label="Feedback comment"
            rows={2}
            style={{
              width: '100%',
              fontSize: '12px',
              color: 'var(--text-primary)',
              border: '1px solid var(--color-grey-200)',
              borderRadius: '6px',
              padding: '8px',
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
              boxSizing: 'border-box',
              background: 'var(--bg-surface)',
            }}
          />
          {error && (
            <p style={{ fontSize: '12px', color: 'var(--error)', margin: 0 }}>{error}</p>
          )}
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ fontSize: '12px', padding: '8px 16px', alignSelf: 'flex-start' }}
          >
            {submitting ? 'Submitting…' : 'Submit feedback'}
          </button>
        </div>
      )}
    </div>
  )
}
