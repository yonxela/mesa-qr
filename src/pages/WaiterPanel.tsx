import { useAuth } from '@/hooks/useAuth'
import { useCollection } from '@/hooks/useCollection'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ServiceRequest } from '@/lib/types'
import { REQUEST_TYPES, REQUEST_STATUS, getTimeDiffMinutes } from '@/lib/utils'
import { Bell, Receipt, BookOpen, AlertTriangle, Check, Eye, ArrowRight, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

const TYPE_ICONS = { Bell, Receipt, BookOpen, AlertTriangle }

export default function WaiterPanel() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const rid = session?.restaurantId || ''

  // All requests for this restaurant
  const { data: requests, loading } = useCollection<ServiceRequest>(`restaurants/${rid}/requests`, [], !!rid)

  // Only show active (non-completed) requests
  const active = requests
    .filter(r => r.status !== 'completed')
    .sort((a, b) => {
      // Priority sort: pending first, then by creation time
      const statusOrder = { pending: 0, seen: 1, in_progress: 2, completed: 3 }
      const diff = statusOrder[a.status] - statusOrder[b.status]
      if (diff !== 0) return diff
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

  const updateStatus = async (req: ServiceRequest, newStatus: ServiceRequest['status']) => {
    try {
      const updates: Record<string, any> = { status: newStatus }
      if (newStatus === 'seen') updates.seen_at = new Date().toISOString()
      if (newStatus === 'in_progress') updates.attended_at = new Date().toISOString()
      if (newStatus === 'completed') updates.completed_at = new Date().toISOString()

      await updateDoc(doc(db, `restaurants/${rid}/requests`, req.id), updates)
    } catch (err) {
      console.error(err)
      toast.error('Error al actualizar')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-dark-950 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Panel Mesero</h1>
          <p className="text-xs text-zinc-500">{active.length} solicitudes activas</p>
        </div>
        <button onClick={handleLogout} className="p-2 rounded-lg text-zinc-500 hover:text-red-400 transition-colors">
          <LogOut size={20} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : active.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">✨</p>
          <p className="text-zinc-500">No hay solicitudes pendientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((req) => {
            const typeInfo = REQUEST_TYPES[req.type]
            const statusInfo = REQUEST_STATUS[req.status]
            const Icon = TYPE_ICONS[typeInfo.icon as keyof typeof TYPE_ICONS] || Bell
            const mins = getTimeDiffMinutes(req.created_at)

            return (
              <div key={req.id} className={`stat-card border-l-4 ${req.status === 'pending' ? 'border-l-yellow-500' : req.status === 'seen' ? 'border-l-blue-500' : 'border-l-indigo-500'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={typeInfo.color} />
                    <div>
                      <p className="font-semibold text-sm">Mesa {req.table_number}</p>
                      <p className="text-xs text-zinc-500">{typeInfo.label} · {mins} min</p>
                    </div>
                  </div>
                  <span className={`badge ${statusInfo.color} text-white text-[10px]`}>{statusInfo.label}</span>
                </div>

                {req.customer_note && (
                  <p className="text-xs text-zinc-400 bg-dark-900 rounded-lg p-2 mb-2 italic">"{req.customer_note}"</p>
                )}

                <div className="flex gap-2 justify-end">
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
                  <button onClick={() => updateStatus(req, 'completed')} className="btn-gold text-xs py-1.5 px-3 flex items-center gap-1">
                    <Check size={12} /> Atendido
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
