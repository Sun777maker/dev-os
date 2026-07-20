'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ContractWithTerms } from '@/types'

export function useContract(contractId: string) {
  return useQuery<ContractWithTerms>({
    queryKey: ['contract', contractId],
    queryFn: async () => {
      const res = await fetch(`/api/contracts/${contractId}`)
      if (!res.ok) throw new Error('Failed to fetch contract')
      return res.json()
    },
    enabled: !!contractId,
    refetchInterval: (query) => {
      // Poll every 2s while contract is still processing
      const status = query.state.data?.contract?.status
      return status === 'processing' || status === 'uploaded' ? 2000 : false
    },
  })
}

export function useEditTerm(contractId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ termId, value }: { termId: string; value: string }) => {
      const res = await fetch(`/api/contracts/${contractId}/terms/${termId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      })
      if (!res.ok) throw new Error('Failed to update term')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] })
    },
  })
}
