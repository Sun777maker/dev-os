import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from '@/components/sign-out-button'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-surface)' }}>
      {/* App nav */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px',
        height: '56px',
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--color-grey-100)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link href="/dashboard" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>
            ContractIQ
          </Link>
          <Link href="/dashboard" className="nav-link">Dashboard</Link>
          <Link href="/upload" className="nav-link">Review a Contract</Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{user.email}</span>
          <SignOutButton />
        </div>
      </nav>

      {/* Page content */}
      <main>{children}</main>
    </div>
  )
}
