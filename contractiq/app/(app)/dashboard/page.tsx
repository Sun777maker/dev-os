import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatsCards } from '@/components/stats-cards'
import { DashboardTable } from '@/components/dashboard-table'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, name, type, status, created_at')
    .order('created_at', { ascending: false })

  const list = contracts ?? []
  const ndaCount = list.filter((c) => c.type === 'NDA').length
  const msaCount = list.filter((c) => c.type === 'MSA').length

  return (
    <div style={{ padding: '48px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
        <h1 className="type-h5" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <Link href="/upload" className="btn-primary">+ Review a Contract</Link>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <StatsCards totalContracts={list.length} ndaCount={ndaCount} msaCount={msaCount} />
      </div>

      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--color-grey-100)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-grey-100)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 className="type-body-lg" style={{ color: 'var(--text-primary)' }}>Contract History</h2>
        </div>
        <DashboardTable contracts={list} />
      </div>
    </div>
  )
}
