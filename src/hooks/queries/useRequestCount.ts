import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export function useRequestCountQuery() {
  return useQuery({
    queryKey: ['layout', 'requestCount'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('t1_requests')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        .not('status', 'in', '("completed","cancelled")')
      if (error) throw error
      return count ?? 0
    },
  })
}
