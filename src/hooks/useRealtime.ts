import { useEffect, useId, useRef } from 'react'
import { supabase } from '../lib/supabase'

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

interface UseRealtimeOptions {
  table: string
  event?: RealtimeEvent
  filter?: string
  onChange: () => void
  enabled?: boolean
}

interface RealtimeConfig {
  event: RealtimeEvent
  schema: 'public'
  table: string
  filter?: string
}

export function useRealtime({ table, event = '*', filter, onChange, enabled = true }: UseRealtimeOptions) {
  const onChangeRef = useRef(onChange)
  const id = useId()

  // Keep the latest callback in a ref so the subscription doesn't re-create on every render.
  useEffect(() => {
    onChangeRef.current = onChange
  })

  useEffect(() => {
    if (!enabled) return

    const channelName = `realtime-${table}-${event}-${filter ?? 'all'}-${id}`
    const config: RealtimeConfig = { event, schema: 'public', table }
    if (filter) config.filter = filter

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', config, () => {
        onChangeRef.current()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, event, filter, enabled, id])
}
