import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export interface Rank {
  id: string
  name: string
  rank_type: string | null
  sort_order: number | null
}

export function useRanksMapQuery() {
  return useQuery({
    queryKey: ['ranks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ranks').select('id, name')
      if (error) throw error
      const map: Record<string, string> = {}
      data?.forEach((r: any) => { map[r.id] = r.name })
      return map
    },
    staleTime: 1000 * 60 * 30,
  })
}

export function useRanksListQuery() {
  return useQuery({
    queryKey: ['ranks', 'list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ranks').select('*').order('sort_order', { ascending: true })
      if (error) throw error
      return (data ?? []) as Rank[]
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useSaveRankMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: { name: string; rank_type: string | null; sort_order: number | null } }) => {
      if (id) {
        const { error } = await supabase.from('ranks').update(payload).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('ranks').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ranks'] })
    },
  })
}

export function useDeleteRankMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ranks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ranks'] })
    },
  })
}
