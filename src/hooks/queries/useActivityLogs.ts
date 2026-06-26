import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export interface LogItem {
  id: string
  created_at: string
  action_type: string
  description: string | null
  old_t1_id: string | null
  new_t1_id: string | null
  old_t1: { full_name: string; staff_id: string } | null
  new_t1: { full_name: string; staff_id: string } | null
  request_id: string | null
  agent_id: string | null
  agent_name?: string
}

export function useActivityLogsQuery() {
  return useQuery({
    queryKey: ['activity_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*, agent: agent_id(full_name, staff_id), old_t1: old_t1_id(full_name, staff_id), new_t1: new_t1_id(full_name, staff_id)')
        .order('created_at', { ascending: false })
        .limit(500)
      if (error) throw error
      return (data ?? []).map((l: Omit<LogItem, 'agent_name'> & { agent?: { full_name: string } }) => ({
        ...l,
        agent_name: l.agent?.full_name ?? null,
      })) as LogItem[]
    },
    staleTime: 1000 * 60 * 5,
  })
}
