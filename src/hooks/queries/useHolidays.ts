import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export interface Holiday {
  id: string
  holiday_date: string
  name: string
  year: number
}

export function useHolidaysSetQuery() {
  return useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      const { data, error } = await supabase.from('holidays').select('holiday_date')
      if (error) throw error
      return new Set<string>((data ?? []).map((h: { holiday_date: string }) => h.holiday_date.slice(0, 10)))
    },
    staleTime: 1000 * 60 * 60,
  })
}

export function useHolidaysListQuery() {
  return useQuery({
    queryKey: ['holidays', 'list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('holidays').select('*').order('holiday_date', { ascending: true })
      if (error) throw error
      return (data ?? []) as Holiday[]
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useAddHolidayMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ holiday_date, name }: { holiday_date: string; name: string }) => {
      const d = new Date(holiday_date)
      const { data, error } = await supabase.from('holidays').insert({
        holiday_date,
        name,
        year: d.getFullYear(),
      }).select()
      if (error) throw error
      return data ?? []
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['holidays'] })
    },
  })
}

export function useDeleteHolidayMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('holidays').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['holidays'] })
    },
  })
}
