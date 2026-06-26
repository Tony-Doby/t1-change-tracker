import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export interface Template {
  id: string
  template_key: string
  name: string
  subject: string
  body: string
  placeholders: string[]
}

export function useEmailTemplatesQuery() {
  return useQuery({
    queryKey: ['email_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('email_templates').select('*').order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []).map((t: { id: string; template_key: string; name: string; subject: string; body: string; placeholders?: string[] }) => ({
        id: t.id,
        template_key: t.template_key,
        name: t.name,
        subject: t.subject,
        body: t.body,
        placeholders: t.placeholders ?? [],
      })) as Template[]
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useSaveEmailTemplateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id?: string
      payload: {
        template_key?: string
        name: string
        subject: string
        body: string
        version?: number
      }
    }) => {
      if (id) {
        const { error } = await supabase.from('email_templates').update({
          name: payload.name,
          subject: payload.subject,
          body: payload.body,
        }).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('email_templates').insert({
          template_key: payload.template_key!,
          name: payload.name,
          subject: payload.subject,
          body: payload.body,
          version: payload.version ?? 1,
        })
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['email_templates'] })
    },
  })
}

export function useDeleteEmailTemplateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('email_templates').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['email_templates'] })
    },
  })
}
