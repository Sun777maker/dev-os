import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px',
        height: '64px',
        borderBottom: '1px solid var(--color-grey-100)',
        position: 'sticky',
        top: 0,
        background: 'var(--bg-primary)',
        zIndex: 50,
      }}>
        <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand)' }}>
          ContractIQ
        </span>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/login" className="btn-ghost">Sign In</Link>
          <Link href="/signup" className="btn-primary">Get Started Free</Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section style={{
        padding: '96px 48px 80px',
        maxWidth: '960px',
        margin: '0 auto',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 12px',
          borderRadius: '4px',
          background: 'var(--color-blue-50)',
          border: '1px solid var(--color-blue-100)',
          marginBottom: '24px',
        }}>
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--brand)' }}>
            NDA &amp; MSA review in under 30 seconds
          </span>
        </div>

        <h1 style={{
          fontSize: '48px',
          fontWeight: 700,
          lineHeight: '56px',
          color: 'var(--text-primary)',
          marginBottom: '24px',
          letterSpacing: 0,
        }}>
          Understand any contract<br />
          <span style={{ color: 'var(--brand)' }}>before you sign</span>
        </h1>

        <p style={{
          fontSize: '18px',
          fontWeight: 400,
          lineHeight: '28px',
          color: 'var(--text-secondary)',
          maxWidth: '600px',
          margin: '0 auto 40px',
        }}>
          Upload an NDA or MSA. ContractIQ extracts the key terms that matter,
          tells you exactly where each one lives in the document, scores its
          confidence — and lets you ask follow‑up questions in plain English.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" className="btn-primary" style={{ fontSize: '16px', padding: '12px 28px' }}>
            Get Started Free
          </Link>
          <Link href="/login" className="btn-ghost" style={{ fontSize: '16px', padding: '12px 28px' }}>
            Sign In
          </Link>
        </div>

        <p style={{
          marginTop: '16px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
        }}>
          Free 14‑day trial · No credit card required
        </p>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section style={{
        padding: '0 48px 96px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 500,
          lineHeight: '32px',
          color: 'var(--text-primary)',
          textAlign: 'center',
          marginBottom: '40px',
        }}>
          Everything you need to review a contract in minutes
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {/* Feature 1 */}
          <div className="feature-card">
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'var(--color-blue-50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              fontSize: '20px',
            }}>
              📄
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Extract Key Terms
            </h3>
            <p style={{ fontSize: '14px', fontWeight: 400, lineHeight: '22px', color: 'var(--text-secondary)' }}>
              Automatically pulls the 10–12 terms that matter most for NDAs and
              MSAs — Governing Law, Liability Cap, IP Ownership, and more —
              with the page number for each.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="feature-card">
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'var(--color-green-50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              fontSize: '20px',
            }}>
              ✓
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Verify with Confidence
            </h3>
            <p style={{ fontSize: '14px', fontWeight: 400, lineHeight: '22px', color: 'var(--text-secondary)' }}>
              Every term shows a confidence score (green / amber / red) and
              the verbatim sentence it was extracted from. Low‑confidence
              terms are flagged for manual review.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="feature-card">
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'var(--color-violet-50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              fontSize: '20px',
            }}>
              💬
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Chat with Your Contract
            </h3>
            <p style={{ fontSize: '14px', fontWeight: 400, lineHeight: '22px', color: 'var(--text-secondary)' }}>
              Ask follow‑up questions in plain English. Every answer is
              grounded strictly in your document text and cites the exact
              page — no hallucinations from general legal knowledge.
            </p>
          </div>
        </div>
      </section>

      {/* ── Social Proof / Stats ─────────────────────────────────────────── */}
      <section style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--color-grey-100)',
        borderBottom: '1px solid var(--color-grey-100)',
        padding: '48px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '64px',
          flexWrap: 'wrap',
          maxWidth: '800px',
          margin: '0 auto',
        }}>
          {[
            { value: '< 30s', label: 'Time to key terms' },
            { value: '≥ 88%', label: 'Extraction accuracy' },
            { value: '≤ $0.25', label: 'Per contract analysis' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--brand)', lineHeight: '40px' }}>
                {value}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-secondary)', marginTop: '4px' }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section style={{
        padding: '96px 48px',
        textAlign: 'center',
        maxWidth: '640px',
        margin: '0 auto',
      }}>
        <h2 style={{
          fontSize: '36px',
          fontWeight: 700,
          lineHeight: '44px',
          color: 'var(--text-primary)',
          marginBottom: '16px',
        }}>
          Stop signing contracts you don't fully understand
        </h2>
        <p style={{
          fontSize: '16px',
          fontWeight: 400,
          lineHeight: '24px',
          color: 'var(--text-secondary)',
          marginBottom: '32px',
        }}>
          $19/month — less than 5 minutes of lawyer time — and you get 10 full contract reviews.
        </p>
        <Link href="/signup" className="btn-primary" style={{ fontSize: '16px', padding: '12px 32px' }}>
          Start Your Free Trial
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--color-grey-100)',
        padding: '24px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand)' }}>ContractIQ</span>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Powered by OpenAI GPT-4o · Not legal advice
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          © 2026 ContractIQ
        </span>
      </footer>

    </div>
  )
}
