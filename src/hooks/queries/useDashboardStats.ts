import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export interface DashboardStats {
  totalAgents: number
  totalRequests: number
  pending: number
  completed: number
}

export function useDashboardStatsQuery() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      // Try RPC first (single call, preferred)
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_dashboard_stats')

      if (!rpcError && rpcData) {
        const result = rpcData as {
          total_agents: number
          total_requests: number
          pending: number
          completed: number
        }
        return {
          totalAgents: result.total_agents ?? 0,
          totalRequests: result.total_requests ?? 0,
          pending: result.pending ?? 0,
          completed: result.completed ?? 0,
        }
      }

      // Fallback: query individual counts if RPC is not deployed or fails
      const [
        { count: totalAgents, error: err1 },
        { count: totalRequests, error: err2 },
        { count: pending, error: err3 },
        { count: completed, error: err4 },
      ] = await Promise.all([
        supabase.from('agents').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('t1_requests').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('t1_requests').select('*', { count: 'exact', head: true }).is('deleted_at', null).in('status', ['step1', 'step2', 'step3', 'step4', 'step5']),
        supabase.from('t1_requests').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'completed'),
      ])

      if (err1 || err2 || err3 || err4) {
        throw new Error(err1?.message || err2?.message || err3?.message || err4?.message || 'Failed to load dashboard stats')
      }

      return {
        totalAgents: totalAgents ?? 0,
        totalRequests: totalRequests ?? 0,
        pending: pending ?? 0,
        completed: completed ?? 0,
      }
    },
    staleTime: 1000 * 60 * 5,
  })
}
