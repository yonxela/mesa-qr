import { useAuth } from '@/hooks/useAuth'
import { useCollection } from '@/hooks/useCollection'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ServiceRequest, Table, Waiter } from '@/lib/types'
import { REQUEST_TYPES, REQUEST_STATUS, getTimeDiffMinutes } from '@/lib/utils'
import { toast } from 'sonner'
import { Bell, Receipt, BookOpen, AlertTriangle, Check, Eye, ArrowRight } from 'lucide-react'

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

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          Monitor En Vivo
        </h1>
        <p className="text-sm text-zinc-500 mt-1">{active.length} solicitudes activas</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : active.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
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
    </div>
  )
}
