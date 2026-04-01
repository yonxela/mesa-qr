import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useRealtime } from '@/hooks/useRealtime'
import { REQUEST_TYPES, REQUEST_STATUS, getTimeDiffSeconds, formatTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Bell, Receipt, BookOpen, AlertTriangle, Send, Eye,
  Clock, CheckCircle2, Loader2, ChefHat, Star,
} from 'lucide-react'
import type { Restaurant, Table, ServiceRequest } from '@/lib/types'

const TYPE_OPTIONS = [
  { key: 'attention' as const, icon: Bell, label: 'Solicitar Mesero', desc: 'Un mesero vendrá a atenderle' },
  { key: 'bill' as const, icon: Receipt, label: 'Pedir la Cuenta', desc: 'Le traeremos su cuenta' },
  { key: 'menu' as const, icon: BookOpen, label: 'Necesito el Menú', desc: 'Le llevaremos un menú' },
  { key: 'complaint' as const, icon: AlertTriangle, label: 'Tengo una Queja', desc: 'Un encargado le atenderá' },
]

type ViewState = 'select' | 'confirm' | 'waiting' | 'completed' | 'error'

export default function CustomerRequest() {
  const { slug, token } = useParams()
  const navigate = useNavigate()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [table, setTable] = useState<Table | null>(null)
  const [view, setView] = useState<ViewState>('select')
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentRequest, setCurrentRequest] = useState<ServiceRequest | null>(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    loadTableInfo()
  }, [slug, token])

  useEffect(() => {
    if (view === 'waiting') {
      const interval = setInterval(() => setTick(t => t + 1), 1000)
      return () => clearInterval(interval)
    }
  }, [view])

  async function loadTableInfo() {
    if (!slug || !token) { setView('error'); setLoading(false); return }

    const { data: rest } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!rest) { setView('error'); setLoading(false); return }
    setRestaurant(rest)

    const { data: tbl } = await supabase
      .from('tables')
      .select('*')
      .eq('qr_token', token)
      .eq('restaurant_id', rest.id)
      .single()

    if (!tbl) { setView('error'); setLoading(false); return }
    setTable(tbl)

    // Check for existing pending request
    const { data: existing } = await supabase
      .from('service_requests')
      .select('*')
      .eq('table_id', tbl.id)
      .in('status', ['pending', 'seen', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existing) {
      setCurrentRequest(existing)
      setView('waiting')
    }

    setLoading(false)
  }

  const handleRealtimeUpdate = useCallback((payload: { new: Record<string, unknown> }) => {
    if (currentRequest && payload.new && payload.new.id === currentRequest.id) {
      const updated = payload.new as unknown as ServiceRequest
      setCurrentRequest(updated)
      if (updated.status === 'completed') {
        setView('completed')
      }
    }
  }, [currentRequest])

  useRealtime({
    table: 'service_requests',
    filter: currentRequest ? `id=eq.${currentRequest.id}` : undefined,
    event: 'UPDATE',
    onRecord: handleRealtimeUpdate,
    enabled: !!currentRequest && view === 'waiting',
  })

  async function submitRequest() {
    if (!selectedType || !table || !restaurant) return
    setSending(true)

    const { data, error } = await supabase
      .from('service_requests')
      .insert({
        table_id: table.id,
        restaurant_id: restaurant.id,
        type: selectedType,
        customer_note: note || null,
        status: 'pending',
      })
      .select()
      .single()

    if (!error && data) {
      setCurrentRequest(data)
      await supabase.from('tables').update({ status: 'needs_attention' }).eq('id', table.id)
      setView('waiting')
    }
    setSending(false)
  }

  const primaryColor = restaurant?.primary_color || '#C6A961'

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
      </div>
    )
  }

  if (view === 'error') {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
        <Card className="glass max-w-sm w-full">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Mesa no encontrada</h2>
            <p className="text-dark-400 text-sm">El código QR no es válido o la mesa no existe.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Restaurant Header */}
      <header className="text-center pt-8 pb-4 px-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-3 text-2xl font-bold font-serif"
            style={{ backgroundColor: primaryColor + '20', color: primaryColor }}
          >
            {restaurant?.name?.charAt(0) || <ChefHat className="w-8 h-8" />}
          </div>
          <h1 className="font-serif text-2xl font-bold" style={{ color: primaryColor }}>
            {restaurant?.name}
          </h1>
          <p className="text-dark-400 text-sm mt-1">Mesa {table?.number}</p>
        </motion.div>
      </header>

      <main className="max-w-md mx-auto px-6 pb-8">
        <AnimatePresence mode="wait">
          {/* SELECT TYPE */}
          {view === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <h2 className="text-center text-lg font-medium text-dark-200 mb-6">
                ¿Qué necesita?
              </h2>
              {TYPE_OPTIONS.map((opt, i) => (
                <motion.button
                  key={opt.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => { setSelectedType(opt.key); setView('confirm') }}
                  className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${
                    'glass-light hover:border-gold-500/30'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: primaryColor + '15' }}
                  >
                    <opt.icon className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{opt.label}</p>
                    <p className="text-xs text-dark-400 mt-0.5">{opt.desc}</p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* CONFIRM */}
          {view === 'confirm' && selectedType && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className="glass">
                <CardContent className="p-6 text-center">
                  <div
                    className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
                    style={{ backgroundColor: primaryColor + '15' }}
                  >
                    {(() => {
                      const Icon = TYPE_OPTIONS.find(o => o.key === selectedType)?.icon || Bell
                      return <Icon className="w-8 h-8" style={{ color: primaryColor }} />
                    })()}
                  </div>
                  <h3 className="text-lg font-semibold mb-1">
                    {REQUEST_TYPES[selectedType as keyof typeof REQUEST_TYPES]?.label}
                  </h3>
                  <p className="text-dark-400 text-sm">Mesa {table?.number}</p>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <label className="text-sm text-dark-300">Nota adicional (opcional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ej: Necesitamos sillas extra..."
                  maxLength={200}
                  className="w-full h-24 rounded-xl border border-dark-600 bg-dark-800 px-4 py-3 text-sm text-dark-50 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none"
                />
              </div>

              <div className="space-y-3">
                <Button onClick={submitRequest} className="w-full gap-2" disabled={sending}>
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Enviar Solicitud
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => { setView('select'); setSelectedType(null); setNote('') }}>
                  Cambiar opción
                </Button>
              </div>
            </motion.div>
          )}

          {/* WAITING */}
          {view === 'waiting' && currentRequest && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-6"
            >
              <Card className="glass overflow-hidden">
                <div className="h-1 gold-gradient" />
                <CardContent className="p-8">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div
                      className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6"
                      style={{ backgroundColor: primaryColor + '20' }}
                    >
                      {currentRequest.status === 'pending' && <Bell className="w-10 h-10" style={{ color: primaryColor }} />}
                      {currentRequest.status === 'seen' && <Eye className="w-10 h-10 text-blue-400" />}
                      {currentRequest.status === 'in_progress' && <Clock className="w-10 h-10 text-green-400" />}
                    </div>
                  </motion.div>

                  <h2 className="text-xl font-bold mb-2">Solicitud Enviada</h2>

                  <Badge variant={
                    currentRequest.status === 'pending' ? 'warning' :
                    currentRequest.status === 'seen' ? 'info' :
                    currentRequest.status === 'in_progress' ? 'success' : 'secondary'
                  } className="text-sm px-4 py-1.5">
                    {REQUEST_STATUS[currentRequest.status]?.label || currentRequest.status}
                  </Badge>

                  <div className="mt-4 space-y-2 text-sm text-dark-400">
                    <p>{REQUEST_TYPES[currentRequest.type]?.label}</p>
                    <p className="flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      Hace {formatTime(getTimeDiffSeconds(currentRequest.created_at))}
                    </p>
                  </div>

                  <div className="mt-6 flex justify-center gap-2">
                    {['pending', 'seen', 'in_progress', 'completed'].map((step, i) => (
                      <div key={step} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full transition-all ${
                          ['pending', 'seen', 'in_progress', 'completed'].indexOf(currentRequest.status) >= i
                            ? 'gold-gradient'
                            : 'bg-dark-600'
                        }`} />
                        {i < 3 && <div className={`w-8 h-0.5 transition-all ${
                          ['pending', 'seen', 'in_progress', 'completed'].indexOf(currentRequest.status) > i
                            ? 'gold-gradient'
                            : 'bg-dark-600'
                        }`} />}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-dark-500 mt-1 px-2">
                    <span>Enviada</span>
                    <span>Vista</span>
                    <span>En camino</span>
                    <span>Atendida</span>
                  </div>
                </CardContent>
              </Card>

              <p className="text-xs text-dark-500">
                Esta página se actualiza automáticamente
              </p>
            </motion.div>
          )}

          {/* COMPLETED */}
          {view === 'completed' && currentRequest && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <Card className="glass">
                <CardContent className="p-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto mb-4" />
                  </motion.div>
                  <h2 className="text-xl font-bold mb-2">Solicitud Atendida</h2>
                  <p className="text-dark-400 text-sm">Gracias por su paciencia</p>
                  {currentRequest.completed_at && (
                    <p className="text-xs text-dark-500 mt-2">
                      Tiempo de atención: {formatTime(getTimeDiffSeconds(currentRequest.created_at, currentRequest.completed_at))}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Button
                onClick={() => navigate(`/r/${slug}/mesa/${token}/calificar/${currentRequest.id}`)}
                className="w-full gap-2"
              >
                <Star className="w-4 h-4" />
                Calificar el Servicio
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => { setCurrentRequest(null); setSelectedType(null); setNote(''); setView('select') }}
              >
                Nueva Solicitud
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
