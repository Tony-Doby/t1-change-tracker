import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export function useT1ChangesQuery() {
  return useQuery({
    queryKey: ['dashboard', 't1Changes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('t1_changes')
        .select('agent_id, change_date, is_counted_for_quota, deleted_at')
        .is('deleted_at', null)
      return data ?? []
    },
    staleTime: 1000 * 60 * 5,
  })
}
