import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Star } from 'lucide-react'

export default function CustomerRating() {
  const { slug, token, requestId } = useParams()
  const [score, setScore] = useState(0)
  const [hoverScore, setHoverScore] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (score === 0 || submitting) return
    setSubmitting(true)

    try {
      // Find restaurant
      const rq = query(collection(db, 'restaurants'), where('slug', '==', slug))
      const rSnap = await getDocs(rq)
      if (rSnap.empty) { alert('Restaurant not found'); return }
      const rid = rSnap.docs[0].id

      // Find table
      const tq = query(collection(db, `restaurants/${rid}/tables`), where('qr_token', '==', token))
      const tSnap = await getDocs(tq)
      const tableId = tSnap.empty ? '' : tSnap.docs[0].id

      await addDoc(collection(db, `restaurants/${rid}/ratings`), {
        request_id: requestId,
        restaurant_id: rid,
        table_id: tableId,
        score,
        comment: comment.trim() || null,
        created_at: new Date().toISOString(),
      })
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      alert('Error al enviar calificación')
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-6">
        <div className="text-center animate-fade-in">
          <p className="text-5xl mb-4">🙏</p>
          <h1 className="text-2xl font-bold mb-2">¡Gracias!</h1>
          <p className="text-zinc-500">Tu opinión nos ayuda a mejorar.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">¿Cómo fue tu experiencia?</h1>
          <p className="text-sm text-zinc-500">Tu opinión es muy importante</p>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onMouseEnter={() => setHoverScore(n)}
              onMouseLeave={() => setHoverScore(0)}
              onClick={() => setScore(n)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={40}
                className={`transition-colors ${
                  n <= (hoverScore || score)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-zinc-700'
                }`}
              />
            </button>
          ))}
        </div>

        {score > 0 && (
          <p className="text-center text-sm text-zinc-400 mb-6">
            {score === 1 ? '😞 Muy malo' : score === 2 ? '😕 Malo' : score === 3 ? '😐 Regular' : score === 4 ? '😊 Bueno' : '🤩 Excelente'}
          </p>
        )}

        {/* Comment */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="¿Algo que quieras comentar? (opcional)"
          rows={3}
          className="input-dark resize-none mb-5"
        />

        <button
          onClick={handleSubmit}
          disabled={score === 0 || submitting}
          className="btn-gold w-full py-4 text-base"
        >
          {submitting ? 'Enviando...' : 'Enviar Calificación'}
        </button>
      </div>
    </div>
  )
}
