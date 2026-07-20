import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ERROR_CODES, ERROR_MESSAGES } from '@/lib/utils/error-codes'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.UNAUTHORIZED, code: ERROR_CODES.UNAUTHORIZED },
      { status: 401 }
    )
  }

  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, name, type, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const list = contracts ?? []
  const totalContracts = list.length
  const ndaCount = list.filter((c) => c.type === 'NDA').length
  const msaCount = list.filter((c) => c.type === 'MSA').length

  return NextResponse.json({
    totalContracts,
    byType: { NDA: ndaCount, MSA: msaCount },
    contracts: list,
  })
}
