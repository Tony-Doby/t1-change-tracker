import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export interface Division {
  id: string
  name: string
  head_agent_id: string | null
  is_official: boolean
  is_default: boolean
}

export function useDivisionsMapQuery() {
  return useQuery({
    queryKey: ['divisions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('divisions').select('id, name')
      if (error) throw error
      const map: Record<string, string> = {}
      data?.forEach((d: { id: string; name: string }) => { map[d.id] = d.name })
      return map
    },
    staleTime: 1000 * 60 * 30,
  })
}

export function useDivisionsListQuery() {
  return useQuery({
    queryKey: ['divisions', 'list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('divisions').select('*').order('name', { ascending: true })
      if (error) throw error
      return (data ?? []) as Division[]
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useSaveDivisionMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: { name: string; head_agent_id: string | null; is_official: boolean } }) => {
      if (id) {
        const { error } = await supabase.from('divisions').update(payload).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('divisions').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['divisions'] })
    },
  })
}

export function useDeleteDivisionMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('divisions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['divisions'] })
    },
  })
}

export function useRecomputeDivisionsMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('recompute_all_divisions', {})
      if (error) throw error
      return data as number
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['divisions'] })
      qc.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}
