import { useAuth } from '@/hooks/useAuth'
import { useCollection } from '@/hooks/useCollection'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ServiceRequest, Table, Waiter } from '@/lib/types'
import { REQUEST_TYPES, REQUEST_STATUS, getTimeDiffMinutes } from '@/lib/utils'
import { toast } from 'sonner'
import { Bell, Receipt, BookOpen, AlertTriangle, Check, Eye, ArrowRight, Clock, History } from 'lucide-react'

const ICONS = { Bell, Receipt, BookOpen, AlertTriangle }

export default function LiveMonitor() {
  const { session } = useAuth()
  const rid = session?.restaurantId || ''
  const { data: requests, loading } = useCollection<ServiceRequest>(`restaurants/${rid}/requests`, [], !!rid)
  const { data: tables } = useCollection<Table>(`restaurants/${rid}/tables`, [], !!rid)
  const { data: waiters } = useCollection<Waiter>(`restaurants/${rid}/waiters`, [], !!rid)

  const active = requests
    .filter(r => r.status !== 'completed')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const completed = requests
    .filter(r => r.status === 'completed')
    .sort((a, b) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime())

  const updateStatus = async (req: ServiceRequest, newStatus: ServiceRequest['status']) => {
    try {
      const updates: Record<string, any> = { status: newStatus }
      if (newStatus === 'seen') updates.seen_at = new Date().toISOString()
      if (newStatus === 'in_progress') updates.attended_at = new Date().toISOString()
      if (newStatus === 'completed') updates.completed_at = new Date().toISOString()

      await updateDoc(doc(db, `restaurants/${rid}/requests`, req.id), updates)
      toast.success(`Solicitud actualizada a: ${REQUEST_STATUS[newStatus].label}`)
    } catch (err) {
      console.error(err)
      toast.error('Error al actualizar')
    }
  }

  const getWaiterName = (id: string | null) => {
    if (!id) return 'Sin asignar'
    return waiters.find(w => w.id === id)?.name || 'Desconocido'
  }

  const formatTime = (isoString: string) => {
    const d = new Date(isoString)
    return d.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
  }

  const getResponseTime = (req: ServiceRequest) => {
    if (!req.completed_at) return null
    const start = new Date(req.created_at).getTime()
    const end = new Date(req.completed_at).getTime()
    const mins = Math.round((end - start) / 60000)
    return mins
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          Monitor En Vivo
        </h1>
        <p className="text-sm text-zinc-500 mt-1">{active.length} solicitudes activas · {completed.length} atendidas hoy</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ═══ ACTIVE REQUESTS ═══ */}
          {active.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <p className="text-lg mb-2">🎉 Todo tranquilo</p>
              <p className="text-sm">No hay solicitudes pendientes</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {active.map((req) => {
                const typeInfo = REQUEST_TYPES[req.type]
                const statusInfo = REQUEST_STATUS[req.status]
                const mins = getTimeDiffMinutes(req.created_at)
                const Icon = ICONS[typeInfo.icon as keyof typeof ICONS] || Bell

                return (
                  <div key={req.id} className={`stat-card border-l-4 ${req.status === 'pending' ? 'border-l-yellow-500' : req.status === 'seen' ? 'border-l-blue-500' : 'border-l-indigo-500'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Icon size={20} className={typeInfo.color} />
                        <div>
                          <p className="font-semibold">Mesa {req.table_number}</p>
                          <p className="text-xs text-zinc-500">{typeInfo.label}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`badge ${statusInfo.color} text-white text-[10px]`}>{statusInfo.label}</span>
                        <p className="text-xs text-zinc-500 mt-1">{mins} min</p>
                      </div>
                    </div>

                    {req.customer_note && (
                      <p className="text-sm text-zinc-400 bg-dark-900 rounded-lg p-2 mb-3 italic">"{req.customer_note}"</p>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-zinc-500">👤 {getWaiterName(req.waiter_id)}</p>
                      <div className="flex gap-2">
                        {req.status === 'pending' && (
                          <button onClick={() => updateStatus(req, 'seen')} className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1">
                            <Eye size={12} /> Visto
                          </button>
                        )}
                        {(req.status === 'pending' || req.status === 'seen') && (
                          <button onClick={() => updateStatus(req, 'in_progress')} className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1 border-blue-500/30 text-blue-400">
                            <ArrowRight size={12} /> En Camino
                          </button>
                        )}
                        {req.status !== 'completed' && (
                          <button onClick={() => updateStatus(req, 'completed')} className="btn-gold text-xs py-1.5 px-3 flex items-center gap-1">
                            <Check size={12} /> Atendido
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ═══ HISTORY ═══ */}
          {completed.length > 0 && (
            <div className="mt-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <History size={18} className="text-zinc-500" />
                  <h2 className="text-lg font-bold text-zinc-300">Historial</h2>
                </div>
                <span className="text-xs text-zinc-600 bg-zinc-800/50 px-2 py-1 rounded-full">{completed.length} atendidas</span>
                <div className="flex-1 border-t border-zinc-800/50" />
              </div>

              <div className="space-y-2">
                {completed.map((req) => {
                  const typeInfo = REQUEST_TYPES[req.type]
                  const Icon = ICONS[typeInfo.icon as keyof typeof ICONS] || Bell
                  const responseTime = getResponseTime(req)

                  return (
                    <div key={req.id} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-zinc-900/30 border border-zinc-800/30 hover:bg-zinc-900/50 transition-colors">
                      {/* Icon */}
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Check size={16} className="text-emerald-400" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-zinc-300">Mesa {req.table_number}</p>
                          <span className="text-[10px] text-zinc-600">·</span>
                          <span className="text-[11px] text-zinc-500">{typeInfo.label}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[11px] text-zinc-600">👤 {getWaiterName(req.waiter_id)}</span>
                          {req.customer_note && (
                            <span className="text-[11px] text-zinc-600 truncate max-w-[150px]" title={req.customer_note}>
                              💬 {req.customer_note}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Time info */}
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 justify-end">
                          <Clock size={11} className="text-zinc-600" />
                          <span className="text-[11px] text-zinc-500">{formatTime(req.created_at)}</span>
                        </div>
                        {responseTime !== null && (
                          <p className={`text-[10px] mt-0.5 font-medium ${
                            responseTime <= 3 ? 'text-emerald-500' : responseTime <= 7 ? 'text-yellow-500' : 'text-red-400'
                          }`}>
                            ⏱ {responseTime} min
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
