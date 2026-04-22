import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { isSupabaseConfigured } from '@/lib/supabase'
import { QrCode, Bell, Clock, BarChart3, Shield, Star, ArrowRight, AlertTriangle, Zap, CheckCircle } from 'lucide-react'

const features = [
  {
    icon: QrCode,
    title: 'QR por Mesa',
    desc: 'Cada mesa tiene su código QR único. El cliente escanea y solicita al instante.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: Bell,
    title: 'Alertas Instantáneas',
    desc: 'El mesero recibe la notificación al momento con sonido en su dispositivo.',
    color: 'from-amber-400 to-orange-500',
  },
  {
    icon: Clock,
    title: 'Control de Tiempos',
    desc: 'Mida cuánto tarda cada atención y mejore la calidad del servicio.',
    color: 'from-cyan-400 to-blue-500',
  },
  {
    icon: BarChart3,
    title: 'Analíticas',
    desc: 'Dashboard con métricas de rendimiento, tiempos y calificaciones en tiempo real.',
    color: 'from-emerald-400 to-teal-500',
  },
  {
    icon: Shield,
    title: 'Multi-Restaurante',
    desc: 'Administre múltiples sucursales desde un solo panel de control unificado.',
    color: 'from-rose-400 to-pink-500',
  },
  {
    icon: Star,
    title: 'Calificaciones',
    desc: 'Los clientes califican el servicio. Datos reales para mejorar continuamente.',
    color: 'from-yellow-400 to-amber-500',
  },
]

const steps = [
  { num: '01', title: 'Escanea', desc: 'El cliente escanea el QR de su mesa con la cámara del celular.', icon: QrCode },
  { num: '02', title: 'Solicita', desc: 'Elige qué necesita: mesero, cuenta, menú o reportar una queja.', icon: Bell },
  { num: '03', title: 'Recibe', desc: 'El mesero asignado recibe la alerta inmediatamente con sonido.', icon: Zap },
  { num: '04', title: 'Atiende', desc: 'El sistema mide el tiempo de respuesta y registra todo.', icon: CheckCircle },
]

const stats = [
  { value: '< 30s', label: 'Tiempo de respuesta' },
  { value: '98%', label: 'Satisfacción promedio' },
  { value: '100%', label: 'Disponibilidad' },
]

export default function Landing() {
  const configured = isSupabaseConfigured()

  return (
    <div className="min-h-screen bg-[#050508] overflow-hidden text-white">
      {/* Config warning */}
      {!configured && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-yellow-500/10 border-b border-yellow-500/30 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
            <p className="text-sm text-yellow-300">
              <strong>Configuración pendiente:</strong> Configure las variables de entorno. Ver <code className="bg-dark-700 px-1.5 py-0.5 rounded text-xs">.env</code> y <code className="bg-dark-700 px-1.5 py-0.5 rounded text-xs">README.md</code>.
            </p>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/40 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-xl blur-sm -z-10" />
            </div>
            <span className="font-bold text-xl tracking-tight">
              Servi<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">QR</span>
            </span>
          </div>
          <Link to="/login">
            <button className="px-5 py-2 rounded-xl text-sm font-medium border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-200 hover:border-white/20">
              Iniciar Sesión
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-20 pb-16 px-6">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-amber-500/10 via-orange-500/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-violet-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-blue-600/5 rounded-full blur-3xl" />
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-8 uppercase tracking-widest">
              <Zap className="w-3 h-3" />
              Sistema de Atención Inteligente
            </div>

            <h1 className="text-6xl md:text-8xl font-black mb-6 leading-[1.05] tracking-tight">
              Atiende mejor,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">
                más rápido
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              El cliente escanea el QR de su mesa, elige lo que necesita y el mesero recibe la alerta al instante.
              Sin esperas, sin señas, sin frustraciones.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login">
                <button className="group relative px-8 py-4 rounded-2xl font-semibold text-base bg-gradient-to-r from-amber-400 to-orange-500 text-black overflow-hidden transition-all hover:shadow-2xl hover:shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98]">
                  <span className="relative z-10 flex items-center gap-2">
                    Comenzar Gratis
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 mt-16">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                    {s.value}
                  </div>
                  <div className="text-xs text-white/40 mt-1 font-medium">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-3">Proceso</p>
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
              Cómo <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">funciona</span>
            </h2>
            <p className="text-white/40 max-w-md mx-auto">
              Cuatro pasos simples para transformar la experiencia de sus clientes.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.num}
                  className="relative rounded-2xl p-6 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="text-xs font-bold text-white/20 mb-4 font-mono">{step.num}</div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 w-6 text-white/20">→</div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-3">Características</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Todo lo que <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">necesita</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  className="group rounded-2xl p-6 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 cursor-default"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} p-0.5 mb-5 shadow-lg`}>
                    <div className="w-full h-full rounded-[10px] bg-[#050508] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            className="rounded-3xl p-12 relative overflow-hidden bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
                Empieza <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">hoy mismo</span>
              </h2>
              <p className="text-white/50 mb-8 leading-relaxed">
                Configure ServiQR en minutos y transforme la experiencia de sus clientes.
              </p>
              <Link to="/login">
                <button className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:shadow-2xl hover:shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                  Acceder al Sistema
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold">
              Servi<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">QR</span>
            </span>
          </div>
          <p className="text-xs text-white/20">© {new Date().getFullYear()} Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
