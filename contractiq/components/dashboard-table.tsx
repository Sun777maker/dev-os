'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Contract } from '@/types'

type SortKey = 'name' | 'type' | 'status' | 'created_at'
type SortDir = 'asc' | 'desc'

type ContractRow = Pick<Contract, 'id' | 'name' | 'type' | 'status' | 'created_at'>

interface DashboardTableProps {
  contracts: ContractRow[]
}

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  processed: { background: 'var(--color-green-50)', color: 'var(--color-green-700)', border: '1px solid var(--color-green-100)' },
  processing: { background: 'var(--color-blue-50)', color: 'var(--brand)', border: '1px solid var(--color-blue-100)' },
  error: { background: 'var(--color-red-50)', color: 'var(--color-red-700)', border: '1px solid var(--color-red-200)' },
  uploaded: { background: 'var(--color-grey-50)', color: 'var(--text-secondary)', border: '1px solid var(--color-grey-100)' },
  uploading: { background: 'var(--color-grey-50)', color: 'var(--text-secondary)', border: '1px solid var(--color-grey-100)' },
}

export function DashboardTable({ contracts }: DashboardTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...contracts].sort((a, b) => {
    const av = a[sortKey] ?? ''
    const bv = b[sortKey] ?? ''
    const cmp = String(av).localeCompare(String(bv))
    return sortDir === 'asc' ? cmp : -cmp
  })

  const headers: { key: SortKey; label: string }[] = [
    { key: 'name', label: 'Contract' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Date' },
  ]

  if (contracts.length === 0) {
    return (
      <div style={{ padding: '64px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px' }}>
          No contracts reviewed yet
        </p>
        <p className="type-body-sm" style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Upload your first NDA or MSA to get started
        </p>
        <Link href="/upload" className="btn-primary">Review a Contract</Link>
      </div>
    )
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: 'var(--bg-surface)' }}>
          {headers.map(({ key, label }) => (
            <th
              key={key}
              onClick={() => toggleSort(key)}
              style={{
                padding: '10px 24px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--color-grey-100)',
                cursor: 'pointer',
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
              {sortKey === key && (
                <span aria-hidden="true" style={{ marginLeft: '4px' }}>
                  {sortDir === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((contract) => (
          <tr
            key={contract.id}
            style={{ borderBottom: '1px solid var(--color-grey-50)', cursor: 'pointer' }}
            onClick={() => window.location.href = `/contracts/${contract.id}`}
          >
            <td style={{ padding: '14px 24px' }}>
              <Link
                href={`/contracts/${contract.id}`}
                onClick={(e) => e.stopPropagation()}
                style={{ fontSize: '14px', fontWeight: 500, color: 'var(--brand)', textDecoration: 'none' }}
              >
                {contract.name}
              </Link>
            </td>
            <td style={{ padding: '14px 24px' }}>
              <span style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                background: 'var(--color-blue-50)',
                color: 'var(--brand)',
                border: '1px solid var(--color-blue-100)',
              }}>
                {contract.type}
              </span>
            </td>
            <td style={{ padding: '14px 24px' }}>
              <span style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                ...STATUS_STYLES[contract.status] ?? STATUS_STYLES.uploaded,
              }}>
                {contract.status}
              </span>
            </td>
            <td style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              {new Date(contract.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
