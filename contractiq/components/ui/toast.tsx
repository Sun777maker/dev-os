'use client'

import { useEffect, type ReactNode } from 'react'

type ToastVariant = 'success' | 'error' | 'warning'

interface ToastProps {
  message: string
  variant?: ToastVariant
  onDismiss: () => void
  duration?: number
}

const VARIANT_STYLES: Record<ToastVariant, React.CSSProperties> = {
  success: {
    background: 'var(--color-green-50)',
    border: '1px solid var(--color-green-200)',
    color: 'var(--color-green-700)',
  },
  error: {
    background: 'var(--color-red-50)',
    border: '1px solid var(--color-red-200)',
    color: 'var(--color-red-700)',
  },
  warning: {
    background: 'var(--color-yellow-50)',
    border: '1px solid var(--color-yellow-200)',
    color: 'var(--color-yellow-800)',
  },
}

export function Toast({ message, variant = 'success', onDismiss, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [onDismiss, duration])

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 200,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        ...VARIANT_STYLES[variant],
      }}
    >
      {message}
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        style={{
          marginLeft: '8px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
          color: 'inherit',
          padding: 0,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  )
}
