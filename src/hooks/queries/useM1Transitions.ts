import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export interface TransitionTask {
  id: string
  m1_agent_id: string
  m1_agent: { full_name: string; staff_id: string; contract_signing_date: string; rank_name: string } | null
  temp_t1_id: string | null
  temp_t1: { full_name: string; staff_id: string } | null
  departed_agent_id: string
  departed_agent: { full_name: string; staff_id: string } | null
  parent_request_id: string | null
  deadline_date: string
  status: string
  daysLeft: number
  email_sent_count: number
  last_email_sent_at: string | null
}

export function useM1TransitionsQuery() {
  return useQuery({
    queryKey: ['dashboard', 'm1Transitions'],
    queryFn: async () => {
      // Process expired M1 transitions (lazy processing)
      await supabase.rpc('process_expired_m1_transitions')

      const { data: tasks, error } = await supabase
        .from('m1_transition_tasks')
        .select(`
          *,
          m1_agent:m1_agent_id(full_name, staff_id, contract_signing_date, rank_name, status),
          temp_t1:temp_t1_id(full_name, staff_id),
          departed_agent:departed_agent_id(full_name, staff_id)
        `)
        .in('status', ['pending', 'expired'])
        .order('deadline_date', { ascending: true })

      if (error) throw error

      const mapped: TransitionTask[] = (tasks ?? [])
        .filter((t: any) => t.m1_agent?.status === 'active')
        .map((t: any) => {
        const daysLeft = Math.ceil(
          (new Date(t.deadline_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
        return {
          id: t.id,
          m1_agent_id: t.m1_agent_id,
          m1_agent: t.m1_agent,
          temp_t1_id: t.temp_t1_id,
          temp_t1: t.temp_t1,
          departed_agent_id: t.departed_agent_id,
          departed_agent: t.departed_agent,
          parent_request_id: t.parent_request_id,
          deadline_date: t.deadline_date,
          status: t.status,
          daysLeft,
          email_sent_count: t.email_sent_count ?? 0,
          last_email_sent_at: t.last_email_sent_at,
        }
      })
      return mapped
    },
    staleTime: 1000 * 60 * 5,
  })
}
