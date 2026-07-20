'use client'

import { useQuery } from '@tanstack/react-query'
import type { DashboardStats } from '@/types'

export function useDashboard() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to load dashboard')
      return res.json()
    },
  })
}
