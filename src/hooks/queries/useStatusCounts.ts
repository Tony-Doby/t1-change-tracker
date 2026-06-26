import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export function useStatusCountsQuery() {
  return useQuery({
    queryKey: ['dashboard', 'statusCounts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('t1_requests')
        .select('status')
        .is('deleted_at', null)
      const counts: Record<string, number> = {}
      data?.forEach((r: { status: string }) => {
        counts[r.status] = (counts[r.status] ?? 0) + 1
      })
      return counts
    },
    staleTime: 1000 * 60 * 5,
  })
}
