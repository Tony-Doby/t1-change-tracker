import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type {
  AppsScriptAction,
  AppsScriptLog,
  AppsScriptParams,
  AppsScriptResponse,
} from '../../types'

export function useAppsScriptMutation() {
  return useMutation({
    mutationFn: async ({ action, params }: { action: AppsScriptAction; params: AppsScriptParams }) => {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      const { data, error } = await supabase.functions.invoke<AppsScriptResponse>('google-apps-script-proxy', {
        body: { action, params },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      if (error) throw new Error(error.message)
      if (!data?.success) throw new Error(data?.error || 'Apps Script request failed')
      return data
    },
  })
}

export function useAppsScriptLogsQuery(limit = 50) {
  return useQuery({
    queryKey: ['apps_script_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apps_script_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []) as AppsScriptLog[]
    },
    staleTime: 1000 * 30,
  })
}

export function useInvalidateAppsScriptLogs() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['apps_script_logs'] })
}
