'use client'

import { KeyTermCard } from '@/components/key-term-card'
import type { KeyTerm } from '@/types'

interface KeyTermsPanelProps {
  terms: KeyTerm[]
  onPageClick?: (page: number) => void
  onEditTerm?: (termId: string, value: string) => void
}

export function KeyTermsPanel({ terms, onPageClick, onEditTerm }: KeyTermsPanelProps) {
  if (terms.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}>
          No key terms extracted yet
        </p>
        <p className="type-body-sm" style={{ color: 'var(--text-secondary)' }}>
          Process the contract to extract key terms
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
      {terms.map((term) => (
        <KeyTermCard
          key={term.id}
          term={term}
          onPageClick={onPageClick}
          onEdit={onEditTerm}
        />
      ))}
    </div>
  )
}
