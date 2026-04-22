import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Loader2, QrCode } from 'lucide-react'

function Particle({ x, y, size, duration, delay }: {
  x: number; y: number; size: number; duration: number; delay: number
}) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(251,146,60,0.5), transparent)',
        pointerEvents: 'none',
      }}
      animate={{ y: [0, -20, 0], opacity: [0.06, 0.35, 0.06] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 7 + 3,
  duration: Math.random() * 4 + 3,
  delay: Math.random() * 3,
}))

export default function Login() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 800)
    return () => clearTimeout(t)
  }, [])

  const doRedirect = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (p) {
        if (p.role === 'super_admin') navigate('/super-admin')
        else if (p.role === 'restaurant_admin') navigate('/dashboard')
        else navigate('/waiter')
      }
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setError('')
    setLoading(true)

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('pin', code.trim().toUpperCase())
      .eq('is_active', true)
      .single()

    if (!profile) {
      const parts = code.trim().split(':')
      if (parts.length === 2) {
        const { error: err } = await signIn(parts[0], parts[1])
        if (!err) { await doRedirect(); return }
      }
      setError('Código incorrecto. Intenta de nuevo.')
      setShake(true)
      setTimeout(() => setShake(false), 600)
      setLoading(false)
      return
    }

    if (profile.role === 'super_admin') navigate('/super-admin')
    else if (profile.role === 'restaurant_admin') navigate('/dashboard')
    else navigate('/waiter')
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#07070f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* Partículas */}
      {PARTICLES.map(p => <Particle key={p.id} {...p} />)}

      {/* Orbe central */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 650, height: 650,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,146,60,0.07) 0%, rgba(249,115,22,0.03) 50%, transparent 70%)',
          pointerEvents: 'none',
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Grid decorativo */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.025, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
      }} />

      {/* Contenedor principal */}
      <motion.div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 360,
          margin: '0 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >

        {/* === LOGO === */}
        <motion.div
          style={{ marginBottom: 28 }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div style={{ position: 'relative' }}>
            <motion.div
              style={{
                position: 'absolute',
                inset: -12,
                borderRadius: 28,
                background: 'linear-gradient(135deg, rgba(251,146,60,0.5), rgba(249,115,22,0.3))',
                filter: 'blur(20px)',
              }}
              animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div style={{
              position: 'relative',
              width: 90, height: 90,
              borderRadius: 22,
              background: 'linear-gradient(135deg, #fbbf24, #f97316)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 20px 60px rgba(249,115,22,0.4)',
            }}>
              <QrCode style={{ width: 44, height: 44, color: 'white' }} strokeWidth={1.5} />
            </div>
          </div>
        </motion.div>

        {/* === NOMBRE === */}
        <motion.div
          style={{ textAlign: 'center', marginBottom: 40 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 style={{
            fontSize: 48, fontWeight: 900, lineHeight: 1,
            letterSpacing: '-0.03em', color: 'white',
            marginBottom: 10, margin: '0 0 10px 0',
          }}>
            Servi<span style={{
              background: 'linear-gradient(135deg, #fbbf24, #f97316)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>QR</span>
          </h1>
          <p style={{
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.22em', color: 'rgba(255,255,255,0.3)',
            textTransform: 'uppercase', margin: '8px 0 0 0',
          }}>
            Sistema de atención
          </p>
        </motion.div>

        {/* === LABEL === */}
        <motion.p
          style={{
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.28)', textAlign: 'center',
            marginBottom: 16,
          }}
          animate={{ opacity: [0.28, 0.55, 0.28] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        >
          Ingresa tu código
        </motion.p>

        {/* === FORMULARIO === */}
        <motion.form
          onSubmit={handleSubmit}
          style={{ width: '100%' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          {/* Card */}
          <div style={{
            borderRadius: 28,
            padding: '28px 28px 28px 28px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}>

            {/* Input */}
            <motion.div
              style={{ marginBottom: 20 }}
              animate={shake ? { x: [-10, 10, -7, 7, -3, 3, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <div style={{
                borderRadius: 18,
                background: 'rgba(0,0,0,0.4)',
                border: `1.5px solid ${error ? 'rgba(239,68,68,0.5)' : code ? 'rgba(251,146,60,0.4)' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: code && !error ? '0 0 0 4px rgba(251,146,60,0.06)' : 'none',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
              }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={code}
                  onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
                  maxLength={20}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="· · · · · ·"
                  style={{
                    width: '100%',
                    background: 'transparent',
                    color: 'white',
                    textAlign: 'center',
                    fontSize: 26,
                    fontWeight: 700,
                    padding: '22px 24px',
                    outline: 'none',
                    border: 'none',
                    letterSpacing: code ? '0.3em' : '0.12em',
                    caretColor: '#f97316',
                    boxSizing: 'border-box',
                  }}
                />
                {code && (
                  <motion.div
                    style={{
                      position: 'absolute', bottom: 0, left: 16, right: 16,
                      height: 2, borderRadius: 2,
                      background: 'linear-gradient(90deg, #fbbf24, #f97316)',
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </div>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  style={{
                    fontSize: 12, color: 'rgba(248,113,113,1)',
                    textAlign: 'center', margin: '0 0 16px 0', padding: '10px 16px',
                    background: 'rgba(239,68,68,0.07)', borderRadius: 12,
                    border: '1px solid rgba(239,68,68,0.15)',
                  }}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Botón */}
            <motion.button
              type="submit"
              disabled={loading || !code.trim()}
              style={{
                width: '100%', padding: '18px 24px',
                borderRadius: 18, border: 'none', cursor: code && !loading ? 'pointer' : 'not-allowed',
                background: 'linear-gradient(135deg, #fbbf24, #f97316)',
                color: 'black', fontWeight: 700, fontSize: 16,
                boxShadow: code && !loading ? '0 10px 35px rgba(249,115,22,0.45)' : 'none',
                opacity: !code.trim() ? 0.45 : 1,
                position: 'relative', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'box-shadow 0.3s ease, opacity 0.3s ease',
              }}
              whileHover={{ scale: code && !loading ? 1.02 : 1 }}
              whileTap={{ scale: code && !loading ? 0.97 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {/* Shimmer animado */}
              {!loading && code && (
                <motion.div
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    transform: 'skewX(-12deg)',
                  }}
                  animate={{ x: ['-120%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
                />
              )}
              {loading
                ? <><Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} /> Verificando...</>
                : 'Acceder'
              }
            </motion.button>
          </div>
        </motion.form>

        {/* Ayuda */}
        <motion.p
          style={{
            marginTop: 20, fontSize: 11, fontWeight: 500,
            color: 'rgba(255,255,255,0.16)', textAlign: 'center',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Código maestro, de restaurante o de mesero
        </motion.p>

      </motion.div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
