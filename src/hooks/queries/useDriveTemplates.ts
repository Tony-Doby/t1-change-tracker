import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { DriveTemplate } from '../../types'

export function useDriveTemplatesQuery() {
  return useQuery({
    queryKey: ['drive_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drive_templates')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return (data ?? []) as DriveTemplate[]
    },
    staleTime: 1000 * 60,
  })
}

export function useCreateDriveTemplateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (template: Omit<DriveTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('drive_templates').insert(template).select().single()
      if (error) throw error
      return data as DriveTemplate
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drive_templates'] }),
  })
}

export function useUpdateDriveTemplateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DriveTemplate> }) => {
      const { data, error } = await supabase.from('drive_templates').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data as DriveTemplate
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drive_templates'] }),
  })
}

export function useDeleteDriveTemplateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('drive_templates').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drive_templates'] }),
  })
}
