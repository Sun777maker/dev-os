import { STANDARD_TERMS } from '@/lib/ai/prompt-templates'
import { Badge } from '@/components/ui/badge'
import type { ContractType } from '@/types'

interface TermPreviewPanelProps {
  contractType: ContractType
  customTerms: string[]
}

export function TermPreviewPanel({ contractType, customTerms }: TermPreviewPanelProps) {
  const standardTerms = STANDARD_TERMS[contractType]

  return (
    <div style={{
      background: 'var(--bg-primary)',
      border: '1px solid var(--color-grey-100)',
      borderRadius: '8px',
      padding: '20px',
    }}>
      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Terms to extract
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {standardTerms.map((term) => (
          <li
            key={term}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-primary)' }}
          >
            {term}
          </li>
        ))}
        {customTerms.map((term) => (
          <li
            key={`custom-${term}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-primary)' }}
          >
            {term}
            <Badge variant="custom">Custom</Badge>
          </li>
        ))}
      </ul>
      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '16px' }}>
        {standardTerms.length + customTerms.length} terms will be extracted
      </p>
    </div>
  )
}
