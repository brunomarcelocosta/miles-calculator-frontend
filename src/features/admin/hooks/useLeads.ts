import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { fetchLeads, type LeadsParams } from '../api/adminApi'

export function useLeads(params: LeadsParams) {
  return useQuery({
    queryKey: ['admin', 'leads', params],
    queryFn: () => fetchLeads(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  })
}
