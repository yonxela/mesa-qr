import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { getTimeDiffMinutes, REQUEST_TYPES } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Clock, Star, TrendingUp, Users, Bell } from 'lucide-react'
import type { ServiceRequest, Profile, Rating } from '@/lib/types'

interface WaiterStats {
  waiter: Profile
  totalRequests: number
  avgResponseTime: number
  avgRating: number
}

export default function Analytics() {
  const { profile } = useAuth()
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [ratings, setRatings] = useState<Rating[]>([])
  const [waiterStats, setWaiterStats] = useState<WaiterStats[]>([])
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today')

  useEffect(() => {
    if (profile?.restaurant_id) loadAnalytics()
  }, [profile, period])

  async function loadAnalytics() {
    const rid = profile!.restaurant_id!
    let dateFilter = ''
    const now = new Date()

    if (period === 'today') dateFilter = now.toISOString().split('T')[0]
    else if (period === 'week') {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      dateFilter = d.toISOString()
    } else if (period === 'month') {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 1)
      dateFilter = d.toISOString()
    }

    let reqQuery = supabase.from('service_requests').select('*').eq('restaurant_id', rid)
    if (dateFilter) reqQuery = reqQuery.gte('created_at', dateFilter)

    const [reqResult, ratResult, waitersResult] = await Promise.all([
      reqQuery.order('created_at', { ascending: false }),
      supabase.from('ratings').select('*').eq('restaurant_id', rid),
      supabase.from('profiles').select('*').eq('restaurant_id', rid).eq('role', 'waiter'),
    ])

    const reqs = reqResult.data || []
    const rats = ratResult.data || []
    const waiters = waitersResult.data || []

    setRequests(reqs)
    setRatings(rats)

    const stats: WaiterStats[] = waiters.map(w => {
      const waiterReqs = reqs.filter(r => r.waiter_id === w.id)
      const completed = waiterReqs.filter(r => r.completed_at)
      const avgTime = completed.length > 0
        ? completed.reduce((sum, r) => sum + getTimeDiffMinutes(r.created_at, r.completed_at!), 0) / completed.length
        : 0

      const waiterRatings = rats.filter(r => {
        const req = reqs.find(req => req.id === r.service_request_id)
        return req?.waiter_id === w.id
      })
      const avgRating = waiterRatings.length > 0
        ? waiterRatings.reduce((sum, r) => sum + r.score, 0) / waiterRatings.length
        : 0

      return { waiter: w, totalRequests: waiterReqs.length, avgResponseTime: Math.round(avgTime), avgRating: Math.round(avgRating * 10) / 10 }
    })

    setWaiterStats(stats.sort((a, b) => b.totalRequests - a.totalRequests))
  }

  const completed = requests.filter(r => r.completed_at)
  const avgTime = completed.length > 0
    ? Math.round(completed.reduce((sum, r) => sum + getTimeDiffMinutes(r.created_at, r.completed_at!), 0) / completed.length)
    : 0
  const avgRating = ratings.length > 0
    ? Math.round(ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length * 10) / 10
    : 0

  const typeCounts = Object.entries(REQUEST_TYPES).map(([key, info]) => ({
    type: key,
    label: info.label,
    count: requests.filter(r => r.type === key).length,
  })).sort((a, b) => b.count - a.count)

  const periods = [
    { key: 'today', label: 'Hoy' },
    { key: 'week', label: '7 días' },
    { key: 'month', label: '30 días' },
    { key: 'all', label: 'Todo' },
  ] as const

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold gold-text">Analíticas</h1>
          <p className="text-dark-400 mt-1">Métricas de rendimiento del servicio</p>
        </div>
        <div className="flex items-center gap-1 bg-dark-800 rounded-xl p-1 border border-dark-700">
          {periods.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                period === p.key ? 'bg-gold-500/20 text-gold-400' : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Solicitudes', value: requests.length, icon: Bell, color: 'text-gold-400' },
          { label: 'Completadas', value: completed.length, icon: TrendingUp, color: 'text-green-400' },
          { label: 'Tiempo Promedio', value: `${avgTime}m`, icon: Clock, color: 'text-blue-400' },
          { label: 'Calificación', value: avgRating > 0 ? `${avgRating}/5` : 'N/A', icon: Star, color: 'text-yellow-400' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="glass">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-dark-400">{s.label}</p>
                    <p className="text-2xl font-bold mt-1">{s.value}</p>
                  </div>
                  <s.icon className={`w-8 h-8 ${s.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Type */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gold-400" />
              Por Tipo de Solicitud
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {typeCounts.map(t => (
                <div key={t.type} className="flex items-center justify-between">
                  <span className="text-sm text-dark-300">{t.label}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full gold-gradient rounded-full transition-all"
                        style={{ width: `${requests.length > 0 ? (t.count / requests.length) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{t.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Waiter Performance */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gold-400" />
              Rendimiento por Mesero
            </CardTitle>
          </CardHeader>
          <CardContent>
            {waiterStats.length === 0 ? (
              <p className="text-dark-400 text-center py-4">Sin datos</p>
            ) : (
              <div className="space-y-3">
                {waiterStats.map((ws) => (
                  <div key={ws.waiter.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-xs font-bold text-dark-900">
                        {ws.waiter.full_name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{ws.waiter.full_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{ws.totalRequests} sol.</Badge>
                      <Badge variant="info">{ws.avgResponseTime}m</Badge>
                      {ws.avgRating > 0 && <Badge variant="warning">{ws.avgRating} <Star className="w-3 h-3 inline" /></Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
