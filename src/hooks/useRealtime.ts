import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeOptions {
  table: string
  filter?: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  onRecord: (payload: { new: Record<string, unknown>; old: Record<string, unknown>; eventType: string }) => void
  enabled?: boolean
}

export function useRealtime({ table, filter, event = '*', onRecord, enabled = true }: UseRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled) return

    const channelName = `realtime-${table}-${filter || 'all'}-${Date.now()}`

    const channelConfig: {
      event: string
      schema: string
      table: string
      filter?: string
    } = {
      event,
      schema: 'public',
      table,
    }

    if (filter) {
      channelConfig.filter = filter
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as never,
        channelConfig,
        (payload: { new: Record<string, unknown>; old: Record<string, unknown>; eventType: string }) => {
          onRecord(payload)
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [table, filter, event, enabled, onRecord])
}
