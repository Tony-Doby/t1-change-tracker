import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Agent } from '../../types'

const PAGE_SIZE = 10

interface UseAgentsOptions {
  search?: string
  filter?: 'all' | 'no_t1' | 'bookmarked'
  page?: number
  bookmarks?: string[]
}

export function useAgentsQuery(options: UseAgentsOptions = {}) {
  const { search = '', filter = 'all', page = 1, bookmarks = [] } = options

  return useQuery({
    queryKey: ['agents', { search, filter, page, bookmarks }],
    queryFn: async () => {
      // Count query
      let countQuery = supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)

      if (filter === 'no_t1') {
        countQuery = countQuery.is('current_t1_id', null)
      }
      if (filter === 'bookmarked' && bookmarks.length > 0) {
        countQuery = countQuery.in('id', bookmarks)
      }

      if (search.trim()) {
        const q = `%${search.trim()}%`
        countQuery = countQuery.or(`full_name.ilike.${q},staff_id.ilike.${q},email.ilike.${q}`)
      }

      const { count } = await countQuery

      // Data query with FK embedding for T1 name
      let query = supabase
        .from('agents')
        .select(`*, t1:current_t1_id(id, full_name, staff_id)`)
        .is('deleted_at', null)

      if (filter === 'no_t1') {
        query = query.is('current_t1_id', null)
      }
      if (filter === 'bookmarked' && bookmarks.length > 0) {
        query = query.in('id', bookmarks)
      }

      if (search.trim()) {
        const q = `%${search.trim()}%`
        query = query.or(`full_name.ilike.${q},staff_id.ilike.${q},email.ilike.${q}`)
      }

      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      const agents = (data ?? []) as Agent[]

      // Build T1 map from embedded FK data
      const t1Map: Record<string, { full_name: string; staff_id: string }> = {}
      agents.forEach((a: any) => {
        if (a.t1?.id) {
          t1Map[a.t1.id] = a.t1
        }
      })

      return { agents, totalCount: count ?? 0, t1Map }
    },
  })
}
