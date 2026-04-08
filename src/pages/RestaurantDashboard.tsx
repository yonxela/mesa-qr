import { useAuth } from '@/hooks/useAuth'
import { useCollection } from '@/hooks/useCollection'
import type { Table, Waiter, ServiceRequest } from '@/lib/types'
import { where } from 'firebase/firestore'
import { UtensilsCrossed, Users, Bell, Clock } from 'lucide-react'

export default function RestaurantDashboard() {
  const { session } = useAuth()
  const rid = session?.restaurantId || ''

  const { data: tables } = useCollection<Table>(`restaurants/${rid}/tables`, [], !!rid)
  const { data: waiters } = useCollection<Waiter>(`restaurants/${rid}/waiters`, [], !!rid)
  const { data: requests } = useCollection<ServiceRequest>(`restaurants/${rid}/requests`, [], !!rid)

  const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'seen')
  const occupiedTables = tables.filter(t => t.status !== 'available')
  const activeWaiters = waiters.filter(w => w.is_active)

  const cards = [
    { label: 'Mesas', value: tables.length, sub: `${occupiedTables.length} ocupadas`, icon: UtensilsCrossed, color: 'text-blue-400' },
    { label: 'Meseros', value: activeWaiters.length, sub: `de ${waiters.length} registrados`, icon: Users, color: 'text-emerald-400' },
    { label: 'Solicitudes Pendientes', value: pendingRequests.length, sub: 'requieren atención', icon: Bell, color: 'text-amber-400' },
    { label: 'Solicitudes Hoy', value: requests.length, sub: 'en total', icon: Clock, color: 'text-purple-400' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{session?.restaurantName || 'Dashboard'}</h1>
        <p className="text-sm text-zinc-500 mt-1">Resumen de actividad del restaurante</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{card.label}</span>
              <card.icon size={18} className={card.color} />
            </div>
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="text-xs text-zinc-500 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent pending requests */}
      {pendingRequests.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">⚡ Solicitudes Pendientes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingRequests.slice(0, 6).map((req) => (
              <div key={req.id} className="stat-card flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${req.status === 'pending' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">Mesa {req.table_number}</p>
                  <p className="text-xs text-zinc-500 capitalize">{req.type === 'attention' ? 'Mesero' : req.type === 'bill' ? 'Cuenta' : req.type === 'menu' ? 'Menú' : 'Queja'}</p>
                </div>
                <span className="text-xs text-zinc-500">
                  {new Date(req.created_at).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
