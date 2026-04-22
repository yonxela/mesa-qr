import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Table } from '@/lib/types'
import { Bell, Receipt, BookOpen, AlertTriangle, Send, Star, Check } from 'lucide-react'

const TYPE_CONFIG = [
  {
    key: 'attention' as const,
    icon: Bell,
    label: 'Mesero',
    desc: 'Solicitar atención',
    emoji: '🔔',
    gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
    glow: 'rgba(245,158,11,0.3)',
  },
  {
    key: 'bill' as const,
    icon: Receipt,
    label: 'La Cuenta',
    desc: 'Pedir la cuenta',
    emoji: '💰',
    gradient: 'linear-gradient(135deg, #10B981, #059669)',
    glow: 'rgba(16,185,129,0.3)',
  },
  {
    key: 'menu' as const,
    icon: BookOpen,
    label: 'Menú',
    desc: 'Necesito un menú',
    emoji: '📖',
    gradient: 'linear-gradient(135deg, #6366F1, #4F46E5)',
    glow: 'rgba(99,102,241,0.3)',
  },
  {
    key: 'complaint' as const,
    icon: AlertTriangle,
    label: 'Queja',
    desc: 'Reportar un problema',
    emoji: '⚠️',
    gradient: 'linear-gradient(135deg, #EF4444, #DC2626)',
    glow: 'rgba(239,68,68,0.3)',
  },
] as const

type RequestKey = typeof TYPE_CONFIG[number]['key']

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

  useEffect(() => {
    const init = async () => {
      try {
        let rDocId = ''
        let rName = ''

        const rq = query(collection(db, 'restaurants'), where('slug', '==', slug))
        const rSnap = await getDocs(rq)

        if (!rSnap.empty) {
          rDocId = rSnap.docs[0].id
          rName = rSnap.docs[0].data().name
        } else {
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
      <div style={styles.screen}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p style={{ color: '#999', fontSize: 14, marginTop: 16 }}>Cargando...</p>
        </div>
      </div>
    )
  }

  // ─── Not Found ───
  if (notFound) {
    return (
      <div style={styles.screen}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>😕</div>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Mesa no encontrada</h1>
          <p style={{ color: '#888', fontSize: 14 }}>El código QR no es válido o ha expirado.</p>
        </div>
      </div>
    )
  }

  // ─── Success ───
  if (submitted) {
    return (
      <div style={styles.screen}>
        <div style={{ textAlign: 'center', padding: 32, width: '100%', maxWidth: 380 }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 0 40px rgba(16,185,129,0.3), 0 0 80px rgba(16,185,129,0.1)',
            animation: 'pulse 2s ease-in-out infinite',
          }}>
            <Check size={48} color="#fff" strokeWidth={3} />
          </div>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>¡Solicitud Enviada!</h1>
          <p style={{ color: '#999', fontSize: 15, marginBottom: 32, lineHeight: 1.5 }}>
            Tu mesero ha sido notificado<br />y vendrá pronto a tu mesa.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => { setSubmitted(false); setSelectedType(null); setNote('') }}
              style={{
                ...styles.secondaryBtn,
              }}
            >
              Hacer otra solicitud
            </button>
            <button
              onClick={() => navigate(`/r/${slug}/mesa/${token}/calificar/${submittedId}`)}
              style={{
                ...styles.primaryBtn,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Star size={18} />
              Calificar Servicio
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Main ───
  return (
    <div style={styles.screen}>
      <div style={{ width: '100%', maxWidth: 440, padding: '0 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', paddingTop: 48, paddingBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 20,
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 16,
          }}>
            <span style={{ fontSize: 11, color: '#aaa', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>
              {restaurantName}
            </span>
          </div>
          <h1 style={{
            color: '#fff', fontSize: 42, fontWeight: 800,
            letterSpacing: -1, lineHeight: 1,
            marginBottom: 8,
          }}>
            Mesa {table?.number}
          </h1>
          <p style={{ color: '#666', fontSize: 15, fontWeight: 400 }}>¿Qué necesitas?</p>
        </div>

        {/* Cards Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 14,
          marginBottom: 20,
        }}>
          {TYPE_CONFIG.map((item, i) => {
            const selected = selectedType === item.key
            return (
              <button
                key={item.key}
                onClick={() => setSelectedType(selected ? null : item.key)}
                style={{
                  position: 'relative',
                  padding: 0,
                  border: 'none',
                  borderRadius: 20,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: selected ? 'scale(1.03)' : 'scale(1)',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{
                  background: selected ? item.gradient : 'rgba(255,255,255,0.04)',
                  border: selected ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20,
                  padding: '28px 16px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: selected ? `0 8px 32px ${item.glow}` : 'none',
                  transition: 'all 0.25s ease',
                }}>
                  <span style={{ fontSize: 36, lineHeight: 1 }}>{item.emoji}</span>
                  <span style={{
                    color: selected ? '#fff' : '#e5e5e5',
                    fontSize: 15, fontWeight: 700,
                    lineHeight: 1.2,
                  }}>
                    {item.label}
                  </span>
                  <span style={{
                    color: selected ? 'rgba(255,255,255,0.8)' : '#777',
                    fontSize: 12, fontWeight: 400,
                    lineHeight: 1.3,
                  }}>
                    {item.desc}
                  </span>
                </div>
                {selected && (
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={14} color="#fff" strokeWidth={3} />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Note */}
        {selectedType && (
          <div style={{ marginBottom: 16 }}>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Agrega un comentario (opcional)"
              rows={2}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: '#e5e5e5',
                fontSize: 14,
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!selectedType || submitting}
          style={{
            ...styles.primaryBtn,
            opacity: selectedType ? 1 : 0.3,
            cursor: selectedType ? 'pointer' : 'not-allowed',
            transform: selectedType ? 'scale(1)' : 'scale(0.98)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            marginBottom: 32,
          }}
        >
          {submitting ? (
            <>
              <div style={{ ...styles.spinner, width: 20, height: 20, borderWidth: 2 }} />
              Enviando...
            </>
          ) : (
            <>
              <Send size={18} />
              Enviar Solicitud
            </>
          )}
        </button>

        {/* Branding */}
        <p style={{
          textAlign: 'center', color: '#444', fontSize: 11,
          paddingBottom: 24, letterSpacing: 0.5,
        }}>
          Powered by <span style={{ color: '#D4A843', fontWeight: 600 }}>ServiQR</span>
        </p>
      </div>
    </div>
  )
}

// ─── Inline Styles ───
const styles: Record<string, React.CSSProperties> = {
  screen: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0C0C0E 0%, #111113 50%, #0A0A0C 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  spinner: {
    width: 36,
    height: 36,
    border: '3px solid rgba(212,168,67,0.2)',
    borderTopColor: '#D4A843',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  primaryBtn: {
    width: '100%',
    padding: '16px 24px',
    borderRadius: 16,
    border: 'none',
    background: 'linear-gradient(135deg, #D4A843, #C49A38)',
    color: '#0A0A0B',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 24px rgba(212,168,67,0.25)',
    fontFamily: 'inherit',
  },
  secondaryBtn: {
    width: '100%',
    padding: '16px 24px',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'transparent',
    color: '#ccc',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
}
