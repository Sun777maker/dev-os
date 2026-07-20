import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
          {label}
        </label>
      )}
      <input
        id={id}
        className={`form-input ${className}`}
        style={error ? { borderColor: 'var(--error)' } : undefined}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '12px', color: 'var(--error)' }}>{error}</span>
      )}
    </div>
  )
}
