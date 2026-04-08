import { useEffect, useState } from 'react'
import { collection, getCountFromServer } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Store, UtensilsCrossed, Users, Bell } from 'lucide-react'

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ restaurants: 0, tables: 0, waiters: 0, requests: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const restSnap = await getCountFromServer(collection(db, 'restaurants'))
      setStats(prev => ({ ...prev, restaurants: restSnap.data().count }))
    } catch (err) {
      console.error('Stats error:', err)
    }
    setLoading(false)
  }

  const cards = [
    { label: 'Restaurantes', value: stats.restaurants, icon: Store, color: 'text-gold-400' },
    { label: 'Mesas Totales', value: stats.tables, icon: UtensilsCrossed, color: 'text-blue-400' },
    { label: 'Meseros Activos', value: stats.waiters, icon: Users, color: 'text-emerald-400' },
    { label: 'Solicitudes Hoy', value: stats.requests, icon: Bell, color: 'text-amber-400' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Panel de administración general</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{card.label}</span>
              <card.icon size={18} className={card.color} />
            </div>
            <p className="text-3xl font-bold">
              {loading ? (
                <span className="inline-block w-8 h-8 bg-dark-700 rounded animate-pulse" />
              ) : card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
