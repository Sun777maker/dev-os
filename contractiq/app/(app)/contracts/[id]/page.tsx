import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ResultsPanel } from '@/components/results-panel'

interface Props {
  params: { id: string }
}

export default async function ResultsPage({ params }: Props) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, user_id, name, type, status, file_path, page_count, token_count, contract_text, created_at, updated_at')
    .eq('id', params.id)
    .single()

  if (!contract) notFound()
  if (contract.user_id !== user.id) redirect('/dashboard')

  const { data: keyTerms } = await supabase
    .from('key_terms')
    .select('id, contract_id, user_id, term_name, value, page_number, confidence_score, source_sentence, is_custom, is_edited, original_value, created_at')
    .eq('contract_id', params.id)
    .order('created_at', { ascending: true })

  let signedUrl: string | null = null
  if (contract.file_path) {
    const { data: urlData } = await supabase.storage
      .from('contracts')
      .createSignedUrl(contract.file_path, 3600)
    signedUrl = urlData?.signedUrl ?? null
  }

  const { contract_text, ...contractWithoutText } = contract

  return (
    <ResultsPanel
      contract={contractWithoutText}
      keyTerms={keyTerms ?? []}
      signedUrl={signedUrl}
      contractText={contract_text ?? null}
    />
  )
}
