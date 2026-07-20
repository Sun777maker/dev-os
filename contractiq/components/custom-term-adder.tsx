'use client'

import { useState } from 'react'

const MAX_CUSTOM_TERMS = 5

interface CustomTermAdderProps {
  terms: string[]
  onChange: (terms: string[]) => void
}

export function CustomTermAdder({ terms, onChange }: CustomTermAdderProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleAdd() {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    if (terms.includes(trimmed)) {
      setError('This term is already added.')
      return
    }
    if (terms.length >= MAX_CUSTOM_TERMS) {
      setError(`Maximum ${MAX_CUSTOM_TERMS} custom terms allowed.`)
      return
    }
    setError(null)
    onChange([...terms, trimmed])
    setInputValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  function handleRemove(term: string) {
    onChange(terms.filter((t) => t !== term))
    setError(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
        Custom key terms
        <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '8px' }}>
          optional · max {MAX_CUSTOM_TERMS}
        </span>
      </label>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          className="form-input"
          style={{ flex: 1 }}
          type="text"
          placeholder="e.g. Non-compete clause"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setError(null) }}
          onKeyDown={handleKeyDown}
          disabled={terms.length >= MAX_CUSTOM_TERMS}
          aria-label="Custom term name"
          aria-describedby={error ? 'custom-term-error' : undefined}
        />
        <button
          type="button"
          className="btn-ghost"
          onClick={handleAdd}
          disabled={!inputValue.trim() || terms.length >= MAX_CUSTOM_TERMS}
          aria-label="Add custom term"
          style={{ whiteSpace: 'nowrap' }}
        >
          + Add
        </button>
      </div>

      {error && (
        <p id="custom-term-error" style={{ fontSize: '12px', color: 'var(--error)', margin: 0 }}>
          {error}
        </p>
      )}

      {terms.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {terms.map((term) => (
            <li
              key={term}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                background: 'var(--color-violet-50)',
                border: '1px solid var(--color-violet-200)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--color-violet-700)',
              }}
            >
              {term}
              <button
                type="button"
                onClick={() => handleRemove(term)}
                aria-label={`Remove custom term: ${term}`}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-violet-500)', fontSize: '16px', lineHeight: 1, padding: '0 2px' }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
