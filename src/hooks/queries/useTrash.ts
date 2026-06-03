import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export interface TrashItem {
  type: 'agent' | 'request'
  id: string
  name: string
  deletedAt: string
}

async function fetchTrash(): Promise<TrashItem[]> {
  const [agentsRes, requestsRes] = await Promise.all([
    supabase.from('agents').select('id, full_name, staff_id, deleted_at').not('deleted_at', 'is', null),
    supabase.from('t1_requests').select('id, agent:agent_id(full_name, staff_id), deleted_at').not('deleted_at', 'is', null),
  ])

  if (agentsRes.error) throw agentsRes.error
  if (requestsRes.error) throw requestsRes.error

  const agents: TrashItem[] = (agentsRes.data ?? []).map((a: any) => ({
    type: 'agent',
    id: a.id,
    name: `${a.full_name} (${a.staff_id})`,
    deletedAt: a.deleted_at,
  }))

  const requests: TrashItem[] = (requestsRes.data ?? []).map((r: any) => ({
    type: 'request',
    id: r.id,
    name: `Request #${r.id.slice(0, 8)} — ${r.agent?.full_name ?? '—'}`,
    deletedAt: r.deleted_at,
  }))

  return [...agents, ...requests]
}

export function useTrashQuery() {
  return useQuery({
    queryKey: ['trash'],
    queryFn: fetchTrash,
    staleTime: 1000 * 60 * 2,
  })
}

export function useRestoreTrashMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (item: TrashItem) => {
      const table = item.type === 'agent' ? 'agents' : 't1_requests'
      const { error } = await supabase.from(table).update({ deleted_at: null }).eq('id', item.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trash'] })
      qc.invalidateQueries({ queryKey: ['agents'] })
      qc.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function usePermanentDeleteTrashMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (item: TrashItem) => {
      const table = item.type === 'agent' ? 'agents' : 't1_requests'
      const { error } = await supabase.from(table).delete().eq('id', item.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trash'] })
    },
  })
}
