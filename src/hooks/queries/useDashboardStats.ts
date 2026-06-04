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
      const { data, error } = await supabase.rpc('get_dashboard_stats')
      if (error) throw error
      const result = data as {
        total_agents: number
        total_requests: number
        pending: number
        completed: number
      } | null
      return {
        totalAgents: result?.total_agents ?? 0,
        totalRequests: result?.total_requests ?? 0,
        pending: result?.pending ?? 0,
        completed: result?.completed ?? 0,
      }
    },
    staleTime: 1000 * 60 * 5,
  })
}
