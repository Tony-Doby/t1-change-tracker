import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { T1Request, RequestStatus } from '../../types'

interface T1RequestWithAgent extends T1Request {
  agent?: { full_name: string; staff_id: string }
}

interface UseRequestsOptions {
  statusFilter?: RequestStatus[]
}

export function useRequestsQuery(options: UseRequestsOptions = {}) {
  const { statusFilter = [] } = options

  return useQuery({
    queryKey: ['requests', { statusFilter }],
    queryFn: async () => {
      let query = supabase
        .from('t1_requests')
        .select('*, agent: agent_id(full_name, staff_id)')
        .is('deleted_at', null)

      if (statusFilter.length > 0) {
        query = query.in('status', statusFilter)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query
      if (error) throw error

      const requests = (data ?? []) as T1RequestWithAgent[]

      const t1Ids = [...new Set(
        requests.flatMap((r) => [r.old_t1_id, r.proposed_new_t1_id]).filter(Boolean)
      )] as string[]

      const t1Map: Record<string, { full_name: string; staff_id: string }> = {}
      if (t1Ids.length > 0) {
        const { data: t1Data } = await supabase
          .from('agents')
          .select('id, full_name, staff_id')
          .in('id', t1Ids)
        t1Data?.forEach((a: { id: string; full_name: string; staff_id: string }) => { t1Map[a.id] = a })
      }

      return { requests, t1Map }
    },
  })
}
