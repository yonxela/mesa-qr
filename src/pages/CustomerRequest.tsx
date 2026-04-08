import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useCollection } from '@/hooks/useCollection'
import type { ServiceRequest, Table } from '@/lib/types'
import { REQUEST_TYPES, REQUEST_STATUS } from '@/lib/utils'
import { Bell, Receipt, BookOpen, AlertTriangle, Send, Star } from 'lucide-react'

const TYPE_ICONS = {
  attention: Bell,
  bill: Receipt,
  menu: BookOpen,
  complaint: AlertTriangle,
}

export default function CustomerRequest() {
  const { slug, token } = useParams()
  const navigate = useNavigate()

  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [restaurantName, setRestaurantName] = useState('')
  const [table, setTable] = useState<Table | null>(null)
  const [loadingInit, setLoadingInit] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [selectedType, setSelectedType] = useState<keyof typeof REQUEST_TYPES | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedId, setSubmittedId] = useState('')

  // Find restaurant and table
  useEffect(() => {
    const init = async () => {
      try {
        // Find restaurant by slug
        const rq = query(collection(db, 'restaurants'), where('slug', '==', slug))
        const rSnap = await getDocs(rq)
        if (rSnap.empty) { setNotFound(true); setLoadingInit(false); return }

        const rDoc = rSnap.docs[0]
        setRestaurantId(rDoc.id)
        setRestaurantName(rDoc.data().name)

        // Find table by qr_token
        const tq = query(collection(db, `restaurants/${rDoc.id}/tables`), where('qr_token', '==', token))
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

  if (loadingInit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950 p-6">
        <div className="text-center">
          <p className="text-4xl mb-4">😕</p>
          <h1 className="text-xl font-bold mb-2">Mesa no encontrada</h1>
          <p className="text-sm text-zinc-500">El código QR no es válido o la mesa fue eliminada.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950 p-6">
        <div className="text-center animate-fade-in max-w-sm">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <Send size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">¡Solicitud Enviada!</h1>
          <p className="text-zinc-500 mb-6">Tu mesero ha sido notificado y vendrá pronto.</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setSubmitted(false); setSelectedType(null); setNote('') }}
              className="btn-outline w-full"
            >
              Hacer otra solicitud
            </button>
            <button
              onClick={() => navigate(`/r/${slug}/mesa/${token}/calificar/${submittedId}`)}
              className="btn-gold w-full flex items-center justify-center gap-2"
            >
              <Star size={16} />
              Calificar Servicio
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{restaurantName}</p>
          <h1 className="text-2xl font-bold">Mesa {table?.number}</h1>
          <p className="text-sm text-zinc-500 mt-1">¿Qué necesitas?</p>
        </div>

        {/* Request type buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {(Object.entries(REQUEST_TYPES) as [keyof typeof REQUEST_TYPES, typeof REQUEST_TYPES[keyof typeof REQUEST_TYPES]][]).map(([key, info]) => {
            const Icon = TYPE_ICONS[key]
            const selected = selectedType === key
            return (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className={`p-5 rounded-xl border text-center transition-all ${
                  selected
                    ? 'border-gold-500 bg-gold-500/10 scale-[1.02]'
                    : 'border-dark-600 bg-dark-800 hover:border-dark-500'
                }`}
              >
                <Icon size={28} className={`mx-auto mb-2 ${selected ? 'text-gold-400' : 'text-zinc-400'}`} />
                <p className={`text-sm font-medium ${selected ? 'text-gold-400' : 'text-zinc-300'}`}>{info.label}</p>
              </button>
            )
          })}
        </div>

        {/* Note */}
        {selectedType && (
          <div className="mb-5 animate-fade-in">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="¿Algo más que quieras agregar? (opcional)"
              rows={2}
              className="input-dark resize-none"
            />
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!selectedType || submitting}
          className="btn-gold w-full py-4 text-base"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
              Enviando...
            </span>
          ) : 'Enviar Solicitud'}
        </button>
      </div>
    </div>
  )
}
