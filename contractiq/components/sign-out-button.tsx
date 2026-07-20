'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button onClick={handleSignOut} className="btn-ghost" style={{ fontSize: '13px', padding: '6px 14px' }}>
      Sign Out
    </button>
  )
}
