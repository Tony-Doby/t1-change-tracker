import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { addBusinessDays } from '../../lib/eligibility'

export interface B2Request {
  id: string
  agent_id: string
  agent: { full_name: string; staff_id: string } | null
  old_t1_id: string | null
  old_t1: { full_name: string; staff_id: string } | null
  proposed_new_t1_id: string
  new_t1: { full_name: string; staff_id: string } | null
  step2_confirmed_at: string
  deadline3: Date
  deadline4: Date
}

export function useB2RequestsQuery() {
  return useQuery({
    queryKey: ['dashboard', 'b2Requests'],
    queryFn: async () => {
      const { data: holidaysData } = await supabase
        .from('holidays')
        .select('holiday_date')
      const holidays = new Set<string>(
        (holidaysData ?? []).map((h: { holiday_date: string }) => h.holiday_date.slice(0, 10))
      )

      const { data: step2Data } = await supabase
        .from('t1_requests')
        .select(`
          id, agent_id, old_t1_id, proposed_new_t1_id, step2_confirmed_at,
          agent:agent_id(full_name, staff_id),
          old_t1:old_t1_id(full_name, staff_id),
          new_t1:proposed_new_t1_id(full_name, staff_id)
        `)
        .eq('status', 'step2')
        .is('deleted_at', null)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: B2Request[] = ((step2Data as unknown[]) ?? []).map((r: any) => {
        const confirmed = r.step2_confirmed_at ?? r.created_at
        return {
          id: r.id,
          agent_id: r.agent_id,
          agent: r.agent,
          old_t1_id: r.old_t1_id,
          old_t1: r.old_t1,
          proposed_new_t1_id: r.proposed_new_t1_id,
          new_t1: r.new_t1,
          step2_confirmed_at: confirmed,
          deadline3: addBusinessDays(confirmed, 3, holidays),
          deadline4: addBusinessDays(confirmed, 4, holidays),
        }
      })
      return mapped
    },
    staleTime: 1000 * 60 * 5,
  })
}
