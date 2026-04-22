import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Table } from '@/lib/types'
import { REQUEST_TYPES } from '@/lib/utils'
import { Bell, Receipt, BookOpen, AlertTriangle, Send, Star, ChevronRight } from 'lucide-react'

const TYPE_CONFIG = {
  attention: { icon: Bell, label: 'Solicitar Mesero', desc: 'Un mesero irá a tu mesa', gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  bill: { icon: Receipt, label: 'Pedir la Cuenta', desc: 'Te llevaremos la cuenta', gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  menu: { icon: BookOpen, label: 'Necesito el Menú', desc: 'Te llevaremos un menú', gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  complaint: { icon: AlertTriangle, label: 'Tengo una Queja', desc: 'Atenderemos tu inquietud', gradient: 'from-red-500 to-rose-600', bg: 'bg-red-500/10', text: 'text-red-400' },
} as const

type RequestKey = keyof typeof TYPE_CONFIG

export default function CustomerRequest() {
  const { slug, token } = useParams()
  const navigate = useNavigate()

  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [restaurantName, setRestaurantName] = useState('')
  const [table, setTable] = useState<Table | null>(null)
  const [loadingInit, setLoadingInit] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [selectedType, setSelectedType] = useState<RequestKey | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedId, setSubmittedId] = useState('')

  // Find restaurant and table
  useEffect(() => {
    const init = async () => {
      try {
        let rDocId = ''
        let rName = ''

        // Try 1: lookup by slug field
        const rq = query(collection(db, 'restaurants'), where('slug', '==', slug))
        const rSnap = await getDocs(rq)

        if (!rSnap.empty) {
          rDocId = rSnap.docs[0].id
          rName = rSnap.docs[0].data().name
        } else {
          // Try 2: direct document ID lookup (QRs use restaurant ID)
          const directDoc = await getDoc(doc(db, 'restaurants', slug!))
          if (directDoc.exists()) {
            rDocId = directDoc.id
            rName = directDoc.data().name
          } else {
            setNotFound(true); setLoadingInit(false); return
          }
        }

        setRestaurantId(rDocId)
        setRestaurantName(rName)

        const tq = query(collection(db, `restaurants/${rDocId}/tables`), where('qr_token', '==', token))
        const tSnap = await getDocs(tq)
        if (tSnap.empty) { setNotFound(true); setLoadingInit(false); return }

        setTable({ id: tSnap.docs[0].id, ...tSnap.docs[0].data() } as Table)
      } catch (err) {
        console.error(err)
        setNotFound(true)
      }
      setLoadingInit(false)
    }
    init()
  }, [slug, token])

  const handleSubmit = async () => {
    if (!selectedType || !restaurantId || !table || submitting) return
    setSubmitting(true)

    try {
      const docRef = await addDoc(collection(db, `restaurants/${restaurantId}/requests`), {
        restaurant_id: restaurantId,
        table_id: table.id,
        table_number: table.number,
        type: selectedType,
        status: 'pending',
        waiter_id: table.assigned_waiter_id || null,
        customer_note: note.trim() || null,
        created_at: new Date().toISOString(),
        seen_at: null,
        attended_at: null,
        completed_at: null,
      })
      setSubmittedId(docRef.id)
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      alert('Error al enviar solicitud. Intenta de nuevo.')
    }
    setSubmitting(false)
  }

  // ─── Loading ───
  if (loadingInit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Cargando mesa...</p>
        </div>
      </div>
    )
  }

  // ─── Not Found ───
  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950 p-6">
        <div className="text-center max-w-xs">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle size={36} className="text-red-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">Mesa no encontrada</h1>
          <p className="text-sm text-zinc-500">El código QR no es válido o la mesa fue eliminada.</p>
        </div>
      </div>
    )
  }

  // ─── Success ───
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950 p-6">
        <div className="text-center animate-fade-in max-w-sm w-full">
          {/* Success animation */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Send size={36} className="text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-2">¡Listo!</h1>
          <p className="text-zinc-400 mb-8">Tu mesero ha sido notificado y vendrá a tu mesa pronto.</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setSubmitted(false); setSelectedType(null); setNote('') }}
              className="w-full py-3.5 rounded-2xl border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800/50 transition-all active:scale-[0.98]"
            >
              Hacer otra solicitud
            </button>
            <button
              onClick={() => navigate(`/r/${slug}/mesa/${token}/calificar/${submittedId}`)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-gold-500 to-gold-600 text-dark-950 font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-gold-500/25 transition-all active:scale-[0.98]"
            >
              <Star size={18} />
              Calificar Servicio
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Main Request Form ───
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      {/* Hero header */}
      <div className="pt-12 pb-8 px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-700/50 mb-4">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-zinc-400 uppercase tracking-widest font-medium">{restaurantName}</span>
        </div>
        <h1 className="text-3xl font-bold mb-1">Mesa {table?.number}</h1>
        <p className="text-zinc-500 text-sm">Selecciona lo que necesitas</p>
      </div>

      {/* Options */}
      <div className="flex-1 px-5 pb-6">
        <div className="space-y-3 max-w-md mx-auto">
          {(Object.entries(TYPE_CONFIG) as [RequestKey, typeof TYPE_CONFIG[RequestKey]][]).map(([key, config]) => {
            const Icon = config.icon
            const selected = selectedType === key
            return (
              <button
                key={key}
                onClick={() => setSelectedType(selected ? null : key)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 text-left active:scale-[0.98] ${
                  selected
                    ? 'border-gold-500/50 bg-gold-500/5 shadow-lg shadow-gold-500/5'
                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  selected ? 'bg-gradient-to-br ' + config.gradient : config.bg
                }`}>
                  <Icon size={22} className={selected ? 'text-white' : config.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-[15px] ${selected ? 'text-white' : 'text-zinc-200'}`}>{config.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{config.desc}</p>
                </div>
                <ChevronRight size={18} className={`shrink-0 transition-transform ${selected ? 'text-gold-400 rotate-90' : 'text-zinc-600'}`} />
              </button>
            )
          })}
        </div>

        {/* Note (appears when type selected) */}
        {selectedType && (
          <div className="max-w-md mx-auto mt-4 animate-fade-in">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="¿Algo más que quieras agregar? (opcional)"
              rows={2}
              className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Fixed bottom button */}
      <div className="sticky bottom-0 p-5 pb-8 bg-gradient-to-t from-dark-950 via-dark-950 to-transparent">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!selectedType || submitting}
            className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] ${
              selectedType
                ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-dark-950 shadow-lg shadow-gold-500/25 hover:shadow-xl hover:shadow-gold-500/30'
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                <span className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send size={18} />
                Enviar Solicitud
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
