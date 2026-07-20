import type { ReactNode } from 'react'

type BadgeVariant = 'confidence-high' | 'confidence-medium' | 'confidence-low' | 'edited' | 'custom' | 'type'

interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
}

const VARIANT_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  'confidence-high': {
    background: 'var(--color-green-50)',
    border: '1px solid var(--color-green-100)',
    color: 'var(--color-green-700)',
  },
  'confidence-medium': {
    background: 'var(--color-yellow-50)',
    border: '1px solid var(--color-yellow-200)',
    color: 'var(--color-yellow-800)',
  },
  'confidence-low': {
    background: 'var(--color-red-50)',
    border: '1px solid var(--color-red-200)',
    color: 'var(--color-red-700)',
  },
  edited: {
    background: 'var(--color-blue-50)',
    border: '1px solid var(--color-blue-100)',
    color: 'var(--brand)',
  },
  custom: {
    background: 'var(--color-violet-50)',
    border: '1px solid var(--color-violet-200)',
    color: 'var(--color-violet-700)',
  },
  type: {
    background: 'var(--color-blue-50)',
    border: '1px solid var(--color-blue-100)',
    color: 'var(--brand)',
  },
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 500,
      lineHeight: '18px',
      ...VARIANT_STYLES[variant],
    }}>
      {children}
    </span>
  )
}

export function ConfidenceBadge({ score }: { score: number }) {
  const variant =
    score >= 0.8 ? 'confidence-high' :
    score >= 0.5 ? 'confidence-medium' :
    'confidence-low'

  const label = `${Math.round(score * 100)}%`

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      {score < 0.5 && <span aria-label="Low confidence warning" role="img">⚠️</span>}
      <Badge variant={variant}>{label}</Badge>
    </span>
  )
}
