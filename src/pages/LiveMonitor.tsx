import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCollection } from '@/hooks/useCollection'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ServiceRequest, Table, Waiter } from '@/lib/types'
import { REQUEST_TYPES, REQUEST_STATUS, getTimeDiffMinutes } from '@/lib/utils'
import { toast } from 'sonner'
import { Bell, Receipt, BookOpen, AlertTriangle, Check, Eye, ArrowRight, Clock, History, Volume2, VolumeX } from 'lucide-react'

const ICONS = { Bell, Receipt, BookOpen, AlertTriangle }

const TYPE_EMOJI: Record<string, string> = {
  attention: '🔔',
  bill: '💰',
  menu: '📖',
  complaint: '⚠️',
}

const TYPE_COLOR: Record<string, string> = {
  attention: '#F59E0B',
  bill: '#10B981',
  menu: '#6366F1',
  complaint: '#EF4444',
}

// Generate notification sound using Web Audio API
function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()

    // Play two ascending tones
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, startTime)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
      osc.start(startTime)
      osc.stop(startTime + duration)
    }

    const now = ctx.currentTime
    playTone(880, now, 0.15)        // A5
    playTone(1100, now + 0.15, 0.15) // C#6
    playTone(1320, now + 0.3, 0.3)   // E6 (longer)

    // Second chime after brief pause
    playTone(880, now + 0.8, 0.15)
    playTone(1100, now + 0.95, 0.15)
    playTone(1320, now + 1.1, 0.3)
  } catch (e) {
    console.warn('Audio not available:', e)
  }
}

export default function LiveMonitor() {
  const { session } = useAuth()
  const rid = session?.restaurantId || ''
  const { data: requests, loading } = useCollection<ServiceRequest>(`restaurants/${rid}/requests`, [], !!rid)
  const { data: tables } = useCollection<Table>(`restaurants/${rid}/tables`, [], !!rid)
  const { data: waiters } = useCollection<Waiter>(`restaurants/${rid}/waiters`, [], !!rid)

  const [soundEnabled, setSoundEnabled] = useState(true)
  const [alertRequest, setAlertRequest] = useState<ServiceRequest | null>(null)
  const prevRequestIdsRef = useRef<Set<string>>(new Set())
  const initialLoadRef = useRef(true)

  const active = requests
    .filter(r => r.status !== 'completed')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const completed = requests
    .filter(r => r.status === 'completed')
    .sort((a, b) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime())

  // Detect new requests
  useEffect(() => {
    if (loading) return

    const currentIds = new Set(requests.filter(r => r.status === 'pending').map(r => r.id))

    // Skip on initial load - just populate the ref
    if (initialLoadRef.current) {
      prevRequestIdsRef.current = currentIds
      initialLoadRef.current = false
      return
    }

    // Find new pending requests that weren't in the previous set
    const newRequests: ServiceRequest[] = []
    for (const req of requests) {
      if (req.status === 'pending' && !prevRequestIdsRef.current.has(req.id)) {
        newRequests.push(req)
      }
    }

    if (newRequests.length > 0) {
      // Show the most recent new request as fullscreen alert
      const newest = newRequests[newRequests.length - 1]
      setAlertRequest(newest)

      // Play sound
      if (soundEnabled) {
        playAlertSound()
      }

      // Auto-dismiss after 6 seconds
      setTimeout(() => {
        setAlertRequest(prev => prev?.id === newest.id ? null : prev)
      }, 6000)
    }

    prevRequestIdsRef.current = currentIds
  }, [requests, loading, soundEnabled])

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
      {/* ═══ FULLSCREEN ALERT ═══ */}
      {alertRequest && (
        <div
          onClick={() => setAlertRequest(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(20px)',
            cursor: 'pointer',
            animation: 'alertFadeIn 0.3s ease-out',
          }}
        >
          {/* Pulsing ring */}
          <div style={{
            position: 'absolute',
            width: 220, height: 220,
            borderRadius: '50%',
            border: `3px solid ${TYPE_COLOR[alertRequest.type] || '#F59E0B'}`,
            opacity: 0.2,
            animation: 'alertPulse 1.5s ease-out infinite',
          }} />

          {/* Emoji */}
          <div style={{
            fontSize: 80,
            marginBottom: 24,
            animation: 'alertBounce 0.5s ease-out',
          }}>
            {TYPE_EMOJI[alertRequest.type] || '🔔'}
          </div>

          {/* Mesa number - HUGE */}
          <h1 style={{
            fontSize: 'clamp(72px, 15vw, 140px)',
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1,
            marginBottom: 8,
            letterSpacing: -3,
            textShadow: `0 0 60px ${TYPE_COLOR[alertRequest.type] || '#F59E0B'}40`,
          }}>
            MESA {alertRequest.table_number}
          </h1>

          {/* Request type */}
          <p style={{
            fontSize: 'clamp(24px, 5vw, 42px)',
            fontWeight: 700,
            color: TYPE_COLOR[alertRequest.type] || '#F59E0B',
            marginBottom: 16,
            textTransform: 'uppercase',
            letterSpacing: 3,
          }}>
            {REQUEST_TYPES[alertRequest.type]?.label || 'Nueva Solicitud'}
          </p>

          {/* Note if any */}
          {alertRequest.customer_note && (
            <p style={{
              fontSize: 'clamp(16px, 3vw, 24px)',
              color: '#999',
              fontStyle: 'italic',
              maxWidth: 600,
              textAlign: 'center',
            }}>
              "{alertRequest.customer_note}"
            </p>
          )}

          {/* Dismiss hint */}
          <p style={{
            position: 'absolute',
            bottom: 40,
            color: '#555',
            fontSize: 14,
            letterSpacing: 1,
          }}>
            Toca para cerrar
          </p>

          {/* Progress bar */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: 4,
            background: TYPE_COLOR[alertRequest.type] || '#F59E0B',
            animation: 'alertProgress 6s linear forwards',
          }} />
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes alertFadeIn {
          from { opacity: 0; transform: scale(1.05); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes alertPulse {
          0% { transform: scale(0.8); opacity: 0.3; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes alertBounce {
          0% { transform: scale(0.3) translateY(40px); opacity: 0; }
          60% { transform: scale(1.1) translateY(-10px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes alertProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            Monitor En Vivo
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{active.length} solicitudes activas · {completed.length} atendidas hoy</p>
        </div>

        {/* Sound toggle */}
        <button
          onClick={() => {
            setSoundEnabled(!soundEnabled)
            if (!soundEnabled) playAlertSound() // Play test sound when enabling
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            soundEnabled
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
          }`}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          {soundEnabled ? 'Sonido ON' : 'Sonido OFF'}
        </button>
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
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Check size={16} className="text-emerald-400" />
                      </div>
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
