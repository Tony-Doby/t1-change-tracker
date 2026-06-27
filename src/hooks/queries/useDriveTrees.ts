import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { DriveTree } from '../../types'

export function useDriveTreesQuery() {
  return useQuery({
    queryKey: ['drive_trees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drive_trees')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as DriveTree[]
    },
    staleTime: 1000 * 60,
  })
}

export function useCreateDriveTreeMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (tree: Omit<DriveTree, 'id' | 'created_at' | 'refreshed_at' | 'created_by'> & { created_by?: string | null }) => {
      const { data, error } = await supabase.from('drive_trees').insert(tree).select().single()
      if (error) throw error
      return data as DriveTree
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drive_trees'] }),
  })
}

export function useUpdateDriveTreeMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DriveTree> }) => {
      const { data, error } = await supabase.from('drive_trees').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data as DriveTree
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drive_trees'] }),
  })
}

export function useDeleteDriveTreeMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('drive_trees').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drive_trees'] }),
  })
}
