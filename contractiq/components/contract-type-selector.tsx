'use client'

import type { ContractType } from '@/types'

interface ContractTypeSelectorProps {
  value: ContractType | null
  onChange: (type: ContractType) => void
  disabled?: boolean
}

export function ContractTypeSelector({ value, onChange, disabled }: ContractTypeSelectorProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label
        htmlFor="contract-type"
        style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}
      >
        Contract type
      </label>
      <select
        id="contract-type"
        className="form-input"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value as ContractType)}
        disabled={disabled}
        aria-label="Select contract type"
      >
        <option value="" disabled>Select type…</option>
        <option value="NDA">Non-Disclosure Agreement (NDA)</option>
        <option value="MSA">Master Service Agreement (MSA)</option>
      </select>
    </div>
  )
}
