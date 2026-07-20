'use client'

import { useRef, useState } from 'react'

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const ACCEPTED_TYPE = 'application/pdf'

interface UploadFormProps {
  file: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
}

export function UploadForm({ file, onChange, disabled }: UploadFormProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [sizeError, setSizeError] = useState(false)

  function validateAndSet(f: File) {
    if (f.type !== ACCEPTED_TYPE && !f.name.toLowerCase().endsWith('.pdf')) {
      setSizeError(false)
      return
    }
    if (f.size > MAX_SIZE_BYTES) {
      setSizeError(true)
      onChange(null)
      return
    }
    setSizeError(false)
    onChange(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    const dropped = e.dataTransfer.files[0]
    if (dropped) validateAndSet(dropped)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected) validateAndSet(selected)
    e.target.value = ''
  }

  function handleRemove() {
    onChange(null)
    setSizeError(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
        Upload PDF
      </label>

      {file ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          border: '1px solid var(--color-green-200)',
          borderRadius: '8px',
          background: 'var(--color-green-50)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>📄</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{file.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove selected file"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '18px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Drop PDF here or click to browse"
          aria-disabled={disabled}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => !disabled && (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragging ? 'var(--brand)' : sizeError ? 'var(--error)' : 'var(--color-grey-200)'}`,
            borderRadius: '8px',
            padding: '48px 24px',
            textAlign: 'center',
            background: dragging ? 'var(--color-blue-50)' : 'var(--bg-surface)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            transition: 'border-color 0.15s ease, background 0.15s ease',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
          <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Drop your PDF here
          </p>
          <p className="type-body-sm" style={{ color: 'var(--text-secondary)' }}>
            or click to browse · Max 10 MB · 20 pages · Text-layer PDFs only
          </p>
        </div>
      )}

      {sizeError && (
        <p style={{ fontSize: '12px', color: 'var(--error)', margin: 0 }}>
          File exceeds the 10 MB limit. Please upload a smaller file.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleChange}
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}
