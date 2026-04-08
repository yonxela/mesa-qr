import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

// ─── Particle System ───
interface Particle {
  x: number; y: number; vx: number; vy: number
  size: number; opacity: number; life: number; maxLife: number
}

function useParticles(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let particles: Particle[] = []
    const maxParticles = 60

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const spawn = () => {
      if (particles.length >= maxParticles) return
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2.5 + 0.5,
        opacity: 0,
        life: 0,
        maxLife: Math.random() * 400 + 200,
      })
    }

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      spawn()
      spawn()

      particles = particles.filter((p) => p.life < p.maxLife)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.life++

        const progress = p.life / p.maxLife
        p.opacity = progress < 0.1 ? progress * 10
          : progress > 0.8 ? (1 - progress) * 5
          : 1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(212, 168, 67, ${p.opacity * 0.35})`
        ctx.fill()
      }

      animId = requestAnimationFrame(tick)
    }

    tick()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [canvasRef])
}

// ─── Login Page ───
export default function Login() {
  const { session, login, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useParticles(canvasRef)

  // Redirect if already logged in
  useEffect(() => {
    if (authLoading) return
    if (session) {
      switch (session.role) {
        case 'super_admin': navigate('/super-admin', { replace: true }); break
        case 'restaurant_admin': navigate('/dashboard', { replace: true }); break
        case 'waiter': navigate('/waiter', { replace: true }); break
      }
    }
  }, [session, authLoading, navigate])

  // Auto-focus
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 500)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || submitting) return

    setError('')
    setSubmitting(true)

    const result = await login(code)
    if (!result.success) {
      setError(result.error || 'Código no válido')
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center relative overflow-hidden">
      {/* Particles */}
      <canvas ref={canvasRef} className="particles-canvas" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
        {/* Logo */}
        <div className="mb-6 animate-float">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #D4A843, #E8BE5A)' }}
          >
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#0A0A0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <circle cx="17.5" cy="17.5" r="3.5" />
              <path d="M17.5 14v1" />
              <path d="M17.5 20v1" />
              <path d="M14 17.5h1" />
              <path d="M20 17.5h1" />
            </svg>
          </div>
        </div>

        {/* Brand */}
        <h1 className="text-4xl font-bold tracking-tight mb-1">
          Servi<span className="text-gold-400">QR</span>
        </h1>
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-10">
          Sistema de Atención
        </p>

        {/* Code label */}
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 mb-4">
          Ingresa tu código
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <div className="glass-card p-6">
            <input
              ref={inputRef}
              type="password"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError('') }}
              placeholder="• • • • • •"
              maxLength={10}
              className="w-full bg-dark-900 border border-dark-600 rounded-xl px-5 py-4 text-center text-lg tracking-[0.5em] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-gold-500 transition-colors"
            />

            <button
              type="submit"
              disabled={!code.trim() || submitting}
              className="btn-gold w-full mt-4 py-4 text-base rounded-xl"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                  Verificando...
                </span>
              ) : 'Acceder'}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <p className="mt-4 text-red-400 text-sm animate-fade-in">{error}</p>
        )}

        {/* Hint */}
        <p className="mt-5 text-xs text-zinc-600 italic">
          Código maestro, de restaurante o de mesero
        </p>
      </div>
    </div>
  )
}
