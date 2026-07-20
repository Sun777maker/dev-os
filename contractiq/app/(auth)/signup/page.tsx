'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--color-grey-100)',
        borderRadius: '12px',
        padding: '40px 32px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>✉️</div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Check your email
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '22px' }}>
          We've sent a confirmation link to <strong>{email}</strong>. Click it to activate your account and get started.
        </p>
      </div>
    )
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '400px',
      background: 'var(--bg-primary)',
      border: '1px solid var(--color-grey-100)',
      borderRadius: '12px',
      padding: '40px 32px',
    }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
        Create your account
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
        14-day free trial · No credit card required
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@company.com"
            className="form-input"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Min. 8 characters"
            className="form-input"
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '6px',
            background: 'var(--color-red-50)',
            border: '1px solid var(--color-red-200)',
            fontSize: '14px',
            color: 'var(--color-red-700)',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', marginTop: '8px' }}
        >
          {loading ? 'Creating account…' : 'Get Started Free'}
        </button>
      </form>

      <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--brand)', fontWeight: 500, textDecoration: 'none' }}>
          Sign in
        </Link>
      </p>
    </div>
  )
}
