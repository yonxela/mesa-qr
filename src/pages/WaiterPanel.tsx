import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useRealtime } from '@/hooks/useRealtime'
import { useSound } from '@/hooks/useSound'
import { REQUEST_TYPES, REQUEST_STATUS, getTimeDiffSeconds, formatTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Bell, Clock, CheckCircle2, LogOut, ChefHat, Eye,
  Volume2, VolumeX, AlertTriangle, Receipt, BookOpen,
} from 'lucide-react'
import type { ServiceRequest, Table, WaiterAssignment } from '@/lib/types'

const TYPE_ICONS: Record<string, typeof Bell> = {
  attention: Bell,
  bill: Receipt,
  menu: BookOpen,
  complaint: AlertTriangle,
}

export default function WaiterPanel() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { playNotification, playUrgent } = useSound()
  const [requests, setRequests] = useState<(ServiceRequest & { table?: Table })[]>([])
  const [assignedTableIds, setAssignedTableIds] = useState<string[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [, setTick] = useState(0)

  useEffect(() => {
    if (profile) loadData()
    const interval = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [profile])

  async function loadData() {
    if (!profile) return

    const { data: assignments } = await supabase
      .from('waiter_assignments')
      .select('table_id')
      .eq('waiter_id', profile.id)

    const tableIds = (assignments || []).map(a => a.table_id)
    setAssignedTableIds(tableIds)

    if (tableIds.length === 0) {
      setRequests([])
      setTables([])
      return
    }

    const [tablesResult, requestsResult] = await Promise.all([
      supabase.from('tables').select('*').in('id', tableIds),
      supabase.from('service_requests').select('*').in('table_id', tableIds).in('status', ['pending', 'seen', 'in_progress']).order('created_at', { ascending: true }),
    ])

    setTables(tablesResult.data || [])
    const tableMap = Object.fromEntries((tablesResult.data || []).map(t => [t.id, t]))
    setRequests((requestsResult.data || []).map(r => ({ ...r, table: tableMap[r.table_id] })))
  }

  const handleNewRequest = useCallback(() => {
    loadData()
    if (soundEnabled) {
      playNotification()
    }
  }, [soundEnabled, profile])

  useRealtime({
    table: 'service_requests',
    filter: profile?.restaurant_id ? `restaurant_id=eq.${profile.restaurant_id}` : undefined,
    onRecord: handleNewRequest,
    enabled: !!profile?.restaurant_id,
  })

  async function updateStatus(id: string, status: string) {
    const updates: Record<string, unknown> = { status, waiter_id: profile!.id }
    if (status === 'seen') updates.seen_at = new Date().toISOString()
    if (status === 'in_progress') updates.attended_at = new Date().toISOString()
    if (status === 'completed') updates.completed_at = new Date().toISOString()

    await supabase.from('service_requests').update(updates).eq('id', id)

    if (status === 'completed') {
      await supabase.from('tables').update({ status: 'occupied' }).eq('id', requests.find(r => r.id === id)?.table_id || '')
    }

    loadData()
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="sticky top-0 z-50 glass">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-dark-900" />
            </div>
            <div>
              <h1 className="font-serif font-bold gold-text">ServiQR</h1>
              <p className="text-xs text-dark-400">{profile?.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Badge variant="danger" className="pulse-gold">
                {pendingCount}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={soundEnabled ? 'text-gold-400' : 'text-dark-500'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-dark-400 hover:text-red-400">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Assigned tables info */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-dark-400">Mis mesas:</span>
          {tables.map(t => (
            <span key={t.id} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-dark-800 border border-dark-700 text-sm font-bold">
              {t.number}
            </span>
          ))}
          {tables.length === 0 && (
            <span className="text-xs text-dark-500">Sin mesas asignadas</span>
          )}
        </div>

        {/* Requests */}
        {requests.length === 0 ? (
          <Card className="glass">
            <CardContent className="py-16 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-dark-200">Sin solicitudes</h3>
              <p className="text-dark-400 text-sm mt-2">
                {tables.length === 0
                  ? 'No tiene mesas asignadas. Contacte al administrador.'
                  : 'Todas sus mesas están atendidas.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {requests.map((r) => {
              const typeInfo = REQUEST_TYPES[r.type]
              const statusInfo = REQUEST_STATUS[r.status]
              const elapsed = getTimeDiffSeconds(r.created_at)
              const Icon = TYPE_ICONS[r.type] || Bell
              const isUrgent = r.type === 'complaint' || elapsed > 120

              return (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className={`rounded-2xl border p-4 ${
                    r.status === 'pending'
                      ? isUrgent
                        ? 'bg-red-500/10 border-red-500/30 shake'
                        : 'glass border-gold-500/30'
                      : 'bg-dark-800 border-dark-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                      r.status === 'pending' ? 'bg-gold-500/20' : 'bg-dark-700'
                    }`}>
                      <span className="text-xl font-bold">{r.table?.number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${typeInfo?.color || 'text-gold-400'}`} />
                        <span className="font-semibold text-sm">{typeInfo?.label}</span>
                        <Badge variant={
                          r.status === 'pending' ? 'warning' :
                          r.status === 'seen' ? 'info' :
                          r.status === 'in_progress' ? 'info' : 'success'
                        } className="text-[10px]">
                          {statusInfo?.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-dark-400">
                        <Clock className="w-3 h-3" />
                        <span className={elapsed > 180 ? 'text-red-400 font-medium' : ''}>
                          {formatTime(elapsed)}
                        </span>
                      </div>
                      {r.customer_note && (
                        <p className="text-xs text-dark-300 mt-1 bg-dark-700/50 rounded-lg p-2">
                          "{r.customer_note}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    {r.status === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => updateStatus(r.id, 'seen')}>
                          <Eye className="w-3 h-3" />
                          Visto
                        </Button>
                        <Button size="sm" className="flex-1 gap-1" onClick={() => updateStatus(r.id, 'in_progress')}>
                          Voy en Camino
                        </Button>
                      </>
                    )}
                    {r.status === 'seen' && (
                      <Button size="sm" className="flex-1 gap-1" onClick={() => updateStatus(r.id, 'in_progress')}>
                        Voy en Camino
                      </Button>
                    )}
                    {(r.status === 'in_progress' || r.status === 'seen') && (
                      <Button size="sm" variant="success" className="flex-1 gap-1" onClick={() => updateStatus(r.id, 'completed')}>
                        <CheckCircle2 className="w-3 h-3" />
                        Completado
                      </Button>
                    )}
                    {r.status === 'pending' && (
                      <Button size="sm" variant="success" className="gap-1" onClick={() => updateStatus(r.id, 'completed')}>
                        <CheckCircle2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </main>
    </div>
  )
}
