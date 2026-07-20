import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-surface)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Minimal nav */}
      <nav style={{
        padding: '0 48px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid var(--color-grey-100)',
        background: 'var(--bg-primary)',
      }}>
        <Link href="/" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>
          ContractIQ
        </Link>
      </nav>

      {/* Centered auth card */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
      }}>
        {children}
      </div>
    </div>
  )
}
