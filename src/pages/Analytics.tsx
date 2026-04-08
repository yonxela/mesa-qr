import { useAuth } from '@/hooks/useAuth'
import { useCollection } from '@/hooks/useCollection'
import type { ServiceRequest, Rating } from '@/lib/types'
import { BarChart3, Clock, Star, TrendingUp } from 'lucide-react'

export default function Analytics() {
  const { session } = useAuth()
  const rid = session?.restaurantId || ''
  const { data: requests } = useCollection<ServiceRequest>(`restaurants/${rid}/requests`, [], !!rid)
  const { data: ratings } = useCollection<Rating>(`restaurants/${rid}/ratings`, [], !!rid)

  const completed = requests.filter(r => r.status === 'completed')
  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1)
    : '—'

  const byType = {
    attention: requests.filter(r => r.type === 'attention').length,
    bill: requests.filter(r => r.type === 'bill').length,
    menu: requests.filter(r => r.type === 'menu').length,
    complaint: requests.filter(r => r.type === 'complaint').length,
  }

  const total = requests.length
  const maxType = Math.max(...Object.values(byType), 1)

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Analíticas</h1>
        <p className="text-sm text-zinc-500 mt-1">Estadísticas de servicio</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Total Solicitudes</span>
            <BarChart3 size={16} className="text-gold-400" />
          </div>
          <p className="text-3xl font-bold">{total}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Completadas</span>
            <TrendingUp size={16} className="text-emerald-400" />
          </div>
          <p className="text-3xl font-bold">{completed.length}</p>
          <p className="text-xs text-zinc-500 mt-1">{total > 0 ? Math.round(completed.length / total * 100) : 0}% del total</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Calificación</span>
            <Star size={16} className="text-amber-400" />
          </div>
          <p className="text-3xl font-bold">{avgRating}</p>
          <p className="text-xs text-zinc-500 mt-1">{ratings.length} reseñas</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Quejas</span>
            <Clock size={16} className="text-red-400" />
          </div>
          <p className="text-3xl font-bold">{byType.complaint}</p>
        </div>
      </div>

      {/* By type chart */}
      <div className="stat-card">
        <h3 className="text-sm font-semibold mb-6 text-zinc-400 uppercase tracking-wider">Solicitudes por Tipo</h3>
        <div className="space-y-4">
          {[
            { key: 'attention', label: 'Solicitar Mesero', color: 'bg-amber-500', count: byType.attention },
            { key: 'bill', label: 'Pedir Cuenta', color: 'bg-emerald-500', count: byType.bill },
            { key: 'menu', label: 'Menú', color: 'bg-blue-500', count: byType.menu },
            { key: 'complaint', label: 'Quejas', color: 'bg-red-500', count: byType.complaint },
          ].map((item) => (
            <div key={item.key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-300">{item.label}</span>
                <span className="text-zinc-500">{item.count}</span>
              </div>
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full transition-all duration-700`}
                  style={{ width: `${(item.count / maxType) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
