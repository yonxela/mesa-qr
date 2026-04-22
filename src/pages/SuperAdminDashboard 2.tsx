import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, Table2, Bell } from 'lucide-react'
import type { Restaurant } from '@/lib/types'

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ restaurants: 0, users: 0, tables: 0, requests: 0 })
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const [r, u, t, s] = await Promise.all([
      supabase.from('restaurants').select('*'),
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('tables').select('id', { count: 'exact' }),
      supabase.from('service_requests').select('id', { count: 'exact' }),
    ])
    setRestaurants(r.data || [])
    setStats({
      restaurants: r.data?.length || 0,
      users: u.count || 0,
      tables: t.count || 0,
      requests: s.count || 0,
    })
  }

  const statCards = [
    { label: 'Restaurantes', value: stats.restaurants, icon: Building2, color: 'text-gold-400' },
    { label: 'Usuarios', value: stats.users, icon: Users, color: 'text-blue-400' },
    { label: 'Mesas', value: stats.tables, icon: Table2, color: 'text-green-400' },
    { label: 'Solicitudes', value: stats.requests, icon: Bell, color: 'text-purple-400' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold gold-text">Panel de Control</h1>
        <p className="text-dark-400 mt-1">Vista general del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-dark-400">{s.label}</p>
                    <p className="text-3xl font-bold mt-1">{s.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-dark-700 flex items-center justify-center ${s.color}`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Restaurantes Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {restaurants.length === 0 ? (
            <p className="text-dark-400 text-center py-8">
              No hay restaurantes registrados. Vaya a la sección de Restaurantes para crear uno.
            </p>
          ) : (
            <div className="space-y-3">
              {restaurants.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-4 rounded-xl bg-dark-700/50 border border-dark-600">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: r.primary_color + '20', color: r.primary_color }}
                    >
                      {r.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-sm text-dark-400">{r.slug}</p>
                    </div>
                  </div>
                  <p className="text-xs text-dark-400">
                    {new Date(r.created_at).toLocaleDateString('es')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
