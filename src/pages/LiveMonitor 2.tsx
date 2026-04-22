import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useRealtime } from '@/hooks/useRealtime'
import { useSound } from '@/hooks/useSound'
import { REQUEST_TYPES, REQUEST_STATUS, getTimeDiffSeconds, formatTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Radio, Clock, Bell, CheckCircle2, Eye } from 'lucide-react'
import type { ServiceRequest, Table, Profile } from '@/lib/types'

interface EnrichedRequest extends ServiceRequest {
  table?: Table
  waiter?: Profile
}

export default function LiveMonitor() {
  const { profile } = useAuth()
  const { playNotification, playUrgent } = useSound()
  const [requests, setRequests] = useState<EnrichedRequest[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [waiters, setWaiters] = useState<Profile[]>([])
  const [, setTick] = useState(0)

  useEffect(() => {
    if (profile?.restaurant_id) loadData()
    const interval = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [profile])

  async function loadData() {
    const rid = profile!.restaurant_id!
    const [r, t, w] = await Promise.all([
      supabase.from('service_requests').select('*').eq('restaurant_id', rid).in('status', ['pending', 'seen', 'in_progress']).order('created_at', { ascending: true }),
      supabase.from('tables').select('*').eq('restaurant_id', rid),
      supabase.from('profiles').select('*').eq('restaurant_id', rid).eq('role', 'waiter'),
    ])
    setTables(t.data || [])
    setWaiters(w.data || [])
    const tableMap = Object.fromEntries((t.data || []).map(t => [t.id, t]))
    const waiterMap = Object.fromEntries((w.data || []).map(w => [w.id, w]))
    setRequests((r.data || []).map(req => ({
      ...req,
      table: tableMap[req.table_id],
      waiter: req.waiter_id ? waiterMap[req.waiter_id] : undefined,
    })))
  }

  const handleRealtimeChange = useCallback(() => {
    loadData()
    playNotification()
  }, [profile?.restaurant_id])

  useRealtime({
    table: 'service_requests',
    filter: `restaurant_id=eq.${profile?.restaurant_id}`,
    onRecord: handleRealtimeChange,
    enabled: !!profile?.restaurant_id,
  })

  async function updateStatus(id: string, status: string) {
    const updates: Record<string, unknown> = { status }
    if (status === 'seen') updates.seen_at = new Date().toISOString()
    if (status === 'in_progress') updates.attended_at = new Date().toISOString()
    if (status === 'completed') updates.completed_at = new Date().toISOString()

    await supabase.from('service_requests').update(updates).eq('id', id)
    loadData()
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold gold-text flex items-center gap-3">
            <Radio className="w-8 h-8 text-red-400 animate-pulse" />
            Monitor en Vivo
          </h1>
          <p className="text-dark-400 mt-1">Solicitudes activas en tiempo real</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="danger" className="text-base px-4 py-2 pulse-gold">
            {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {requests.length === 0 ? (
        <Card className="glass">
          <CardContent className="py-16 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-dark-300">Todo en orden</h3>
            <p className="text-dark-500 text-sm mt-1">No hay solicitudes pendientes en este momento</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {requests.map((r) => {
              const typeInfo = REQUEST_TYPES[r.type]
              const statusInfo = REQUEST_STATUS[r.status]
              const elapsed = getTimeDiffSeconds(r.created_at)

              return (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`rounded-2xl border p-5 ${
                    r.status === 'pending' ? 'glass border-gold-500/30 shake' :
                    r.status === 'seen' ? 'bg-dark-800 border-blue-500/30' :
                    'bg-dark-800 border-dark-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold ${
                        r.status === 'pending' ? 'bg-gold-500/20 gold-text' : 'bg-dark-700 text-dark-300'
                      }`}>
                        {r.table?.number || '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{typeInfo?.label || r.type}</p>
                          <Badge variant={
                            r.status === 'pending' ? 'warning' :
                            r.status === 'seen' ? 'info' : 'secondary'
                          }>
                            {statusInfo?.label || r.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-dark-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(elapsed)}
                          </span>
                          {r.waiter && (
                            <span>Mesero: {r.waiter.full_name}</span>
                          )}
                          {r.customer_note && (
                            <span className="text-dark-300">"{r.customer_note}"</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.status === 'pending' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'seen')} className="gap-1">
                          <Eye className="w-3 h-3" />
                          Visto
                        </Button>
                      )}
                      {(r.status === 'pending' || r.status === 'seen') && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'in_progress')} className="gap-1">
                          En Camino
                        </Button>
                      )}
                      {r.status !== 'completed' && (
                        <Button size="sm" variant="success" onClick={() => updateStatus(r.id, 'completed')} className="gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Completar
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
