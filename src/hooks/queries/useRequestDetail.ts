import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export interface RequestDetailData {
  request: any
  comments: any[]
  stepHistory: any[]
  holidays: Set<string>
}

export function useRequestDetailQuery(requestId: string | undefined) {
  return useQuery({
    queryKey: ['request', 'detail', requestId],
    queryFn: async () => {
      if (!requestId) {
        return { request: null, comments: [], stepHistory: [], holidays: new Set<string>() }
      }

      const { data: req } = await supabase
        .from('t1_requests')
        .select(`
          *,
          agent: agent_id(full_name, staff_id),
          old_t1: old_t1_id(full_name, staff_id),
          new_t1: proposed_new_t1_id(full_name, staff_id)
        `)
        .eq('id', requestId)
        .single()

      const { data: cmts } = await supabase
        .from('request_comments')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true })

      const { data: logs } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('request_id', requestId)
        .eq('action_type', 'request_step_changed')
        .order('created_at', { ascending: true })

      const { data: holidaysData } = await supabase
        .from('holidays')
        .select('holiday_date')
      const holidays = new Set<string>(
        (holidaysData ?? []).map((h: any) => h.holiday_date.slice(0, 10))
      )

      return {
        request: req,
        comments: cmts ?? [],
        stepHistory: logs ?? [],
        holidays,
      }
    },
    enabled: !!requestId,
  })
}
