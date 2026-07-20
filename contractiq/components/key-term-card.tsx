'use client'

import { useState } from 'react'
import { ConfidenceBadge, Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
import type { KeyTerm } from '@/types'

interface KeyTermCardProps {
  term: KeyTerm
  onPageClick?: (page: number) => void
  onEdit?: (termId: string, value: string) => void
  isEditing?: boolean
}

export function KeyTermCard({ term, onPageClick, onEdit }: KeyTermCardProps) {
  const [editMode, setEditMode] = useState(false)
  const [editValue, setEditValue] = useState(term.value ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const trimmed = editValue.trim()
    if (!trimmed || trimmed === term.value) {
      setEditMode(false)
      setEditValue(term.value ?? '')
      return
    }
    setSaving(true)
    try {
      await onEdit?.(term.id, trimmed)
    } finally {
      setSaving(false)
      setEditMode(false)
    }
  }

  function handleCancel() {
    setEditMode(false)
    setEditValue(term.value ?? '')
  }

  return (
    <div style={{
      padding: '14px 16px',
      border: '1px solid var(--color-grey-100)',
      borderRadius: '8px',
      background: 'var(--bg-primary)',
    }}>
      {/* Header row: term name + badges */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {term.term_name}
          </span>
          {term.is_custom && <Badge variant="custom">Custom</Badge>}
          {term.is_edited && <Badge variant="edited">Edited</Badge>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {term.confidence_score !== null && (
            <ConfidenceBadge score={term.confidence_score} />
          )}
          {term.source_sentence && (
            <Tooltip content={term.source_sentence}>
              <button
                type="button"
                aria-label={`Why: source sentence for ${term.term_name}`}
                style={{
                  background: 'var(--color-grey-50)',
                  border: '1px solid var(--color-grey-200)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  padding: '2px 6px',
                  fontWeight: 500,
                }}
              >
                Why?
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Value row */}
      {editMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            aria-label={`Edit value for ${term.term_name}`}
            autoFocus
            rows={2}
            style={{
              width: '100%',
              fontSize: '14px',
              color: 'var(--text-primary)',
              border: '1px solid var(--brand)',
              borderRadius: '6px',
              padding: '8px',
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-primary"
              style={{ fontSize: '12px', padding: '6px 14px' }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              className="btn-ghost"
              style={{ fontSize: '12px', padding: '6px 14px' }}
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div>
            <p style={{ fontSize: '14px', color: term.value ? 'var(--text-primary)' : 'var(--text-secondary)', fontStyle: term.value ? 'normal' : 'italic', margin: 0 }}>
              {term.value ?? 'Not found in document'}
            </p>
            {term.is_edited && term.original_value && (
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                AI original: {term.original_value}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {term.page_number !== null && (
              <button
                type="button"
                onClick={() => onPageClick?.(term.page_number!)}
                aria-label={`Go to page ${term.page_number}`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: 'var(--brand)',
                  padding: '2px 4px',
                  textDecoration: 'underline',
                  textDecorationStyle: 'dotted',
                }}
              >
                p. {term.page_number}
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={() => { setEditMode(true); setEditValue(term.value ?? '') }}
                aria-label={`Edit value for ${term.term_name}`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  padding: '2px',
                  lineHeight: 1,
                }}
                title="Edit"
              >
                ✏️
              </button>
            )}
          </div>
        </div>
      )}

      {/* Low-confidence warning */}
      {term.confidence_score !== null && term.confidence_score < 0.5 && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            marginTop: '8px',
            padding: '6px 10px',
            background: 'var(--color-yellow-50)',
            border: '1px solid var(--color-yellow-200)',
            borderRadius: '4px',
            fontSize: '12px',
            color: 'var(--color-yellow-800)',
          }}
        >
          ⚠️ Low confidence — verify this term in the document before relying on it
        </div>
      )}
    </div>
  )
}
