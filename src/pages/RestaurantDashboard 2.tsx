import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table2, Users, Bell, Clock, Star, TrendingUp } from 'lucide-react'
import { getTimeDiffMinutes, REQUEST_TYPES, REQUEST_STATUS } from '@/lib/utils'
import type { ServiceRequest, Table } from '@/lib/types'

export default function RestaurantDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ tables: 0, waiters: 0, todayRequests: 0, avgTime: 0, avgRating: 0, pendingNow: 0 })
  const [recentRequests, setRecentRequests] = useState<(ServiceRequest & { table?: Table })[]>([])

  useEffect(() => {
    if (profile?.restaurant_id) loadStats()
  }, [profile])

  async function loadStats() {
    const rid = profile!.restaurant_id!
    const today = new Date().toISOString().split('T')[0]

    const [tables, waiters, todayReqs, ratings, pending] = await Promise.all([
      supabase.from('tables').select('id', { count: 'exact' }).eq('restaurant_id', rid),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('restaurant_id', rid).eq('role', 'waiter'),
      supabase.from('service_requests').select('*').eq('restaurant_id', rid).gte('created_at', today),
      supabase.from('ratings').select('score').eq('restaurant_id', rid),
      supabase.from('service_requests').select('*').eq('restaurant_id', rid).eq('status', 'pending'),
    ])

    const completedReqs = (todayReqs.data || []).filter(r => r.completed_at)
    const avgTime = completedReqs.length > 0
      ? completedReqs.reduce((sum, r) => sum + getTimeDiffMinutes(r.created_at, r.completed_at!), 0) / completedReqs.length
      : 0

    const avgRating = (ratings.data || []).length > 0
      ? (ratings.data || []).reduce((sum, r) => sum + r.score, 0) / (ratings.data || []).length
      : 0

    setStats({
      tables: tables.count || 0,
      waiters: waiters.count || 0,
      todayRequests: todayReqs.data?.length || 0,
      avgTime: Math.round(avgTime),
      avgRating: Math.round(avgRating * 10) / 10,
      pendingNow: pending.data?.length || 0,
    })

    const { data: recent } = await supabase
      .from('service_requests')
      .select('*')
      .eq('restaurant_id', rid)
      .order('created_at', { ascending: false })
      .limit(10)

    if (recent) {
      const tableIds = [...new Set(recent.map(r => r.table_id))]
      const { data: tablesData } = await supabase.from('tables').select('*').in('id', tableIds)
      const tableMap = Object.fromEntries((tablesData || []).map(t => [t.id, t]))
      setRecentRequests(recent.map(r => ({ ...r, table: tableMap[r.table_id] })))
    }
  }

  const statCards = [
    { label: 'Mesas', value: stats.tables, icon: Table2, color: 'text-gold-400' },
    { label: 'Meseros', value: stats.waiters, icon: Users, color: 'text-blue-400' },
    { label: 'Solicitudes Hoy', value: stats.todayRequests, icon: Bell, color: 'text-green-400' },
    { label: 'Pendientes Ahora', value: stats.pendingNow, icon: Clock, color: stats.pendingNow > 0 ? 'text-red-400' : 'text-dark-400' },
    { label: 'Tiempo Promedio', value: `${stats.avgTime}m`, icon: TrendingUp, color: 'text-purple-400' },
    { label: 'Calificación', value: stats.avgRating > 0 ? `${stats.avgRating}/5` : 'N/A', icon: Star, color: 'text-yellow-400' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold gold-text">Dashboard</h1>
        <p className="text-dark-400 mt-1">Resumen de hoy</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="glass">
              <CardContent className="p-4 text-center">
                <s.icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-dark-400 mt-1">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Solicitudes Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <p className="text-dark-400 text-center py-8">No hay solicitudes recientes</p>
          ) : (
            <div className="space-y-2">
              {recentRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-700/50 border border-dark-600">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-dark-600 flex items-center justify-center text-sm font-bold">
                      {r.table?.number || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{REQUEST_TYPES[r.type]?.label || r.type}</p>
                      <p className="text-xs text-dark-400">
                        Mesa {r.table?.number} &middot; {new Date(r.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    r.status === 'completed' ? 'success' :
                    r.status === 'pending' ? 'warning' :
                    r.status === 'in_progress' ? 'info' : 'secondary'
                  }>
                    {REQUEST_STATUS[r.status]?.label || r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
