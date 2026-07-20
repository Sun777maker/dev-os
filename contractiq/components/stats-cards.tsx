interface StatsCardsProps {
  totalContracts: number
  ndaCount: number
  msaCount: number
}

export function StatsCards({ totalContracts, ndaCount, msaCount }: StatsCardsProps) {
  const stats = [
    { label: 'Total Contracts', value: totalContracts },
    { label: 'NDAs Reviewed', value: ndaCount },
    { label: 'MSAs Reviewed', value: msaCount },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
      {stats.map(({ label, value }) => (
        <div
          key={label}
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--color-grey-100)',
            borderRadius: '8px',
            padding: '24px',
          }}
        >
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: '40px' }}>
            {value}
          </div>
          <div className="type-body-sm" style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  )
}
