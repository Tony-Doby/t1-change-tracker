import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { BOOKMARKS_KEY } from '../../lib/constants'

export function useBookmarkedAgentsQuery() {
  return useQuery({
    queryKey: ['dashboard', 'bookmarkedAgents'],
    queryFn: async () => {
      const bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]') as string[]
      if (bookmarks.length === 0) return []
      const { data } = await supabase
        .from('agents')
        .select('*')
        .in('id', bookmarks)
        .is('deleted_at', null)
      return data ?? []
    },
    staleTime: 1000 * 60 * 5,
  })
}
