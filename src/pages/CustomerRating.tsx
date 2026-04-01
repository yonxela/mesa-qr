import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, CheckCircle2, Loader2 } from 'lucide-react'

export default function CustomerRating() {
  const { slug, token, requestId } = useParams()
  const navigate = useNavigate()
  const [score, setScore] = useState(0)
  const [hoveredScore, setHoveredScore] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submitRating() {
    if (score === 0 || !requestId) return
    setLoading(true)

    const { data: request } = await supabase
      .from('service_requests')
      .select('table_id, restaurant_id')
      .eq('id', requestId)
      .single()

    if (request) {
      await supabase.from('ratings').insert({
        service_request_id: requestId,
        table_id: request.table_id,
        restaurant_id: request.restaurant_id,
        score,
        comment: comment || null,
      })
    }

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full"
        >
          <Card className="glass">
            <CardContent className="py-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              >
                <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-xl font-bold mb-2">¡Gracias!</h2>
              <p className="text-dark-400 text-sm">Su calificación nos ayuda a mejorar el servicio.</p>
              <div className="flex justify-center gap-1 mt-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className={`w-6 h-6 ${i <= score ? 'text-gold-400 fill-gold-400' : 'text-dark-600'}`} />
                ))}
              </div>
              <Button
                variant="ghost"
                className="mt-6"
                onClick={() => navigate(`/r/${slug}/mesa/${token}`)}
              >
                Volver al menú
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full space-y-6"
      >
        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold gold-text">Califique el Servicio</h1>
          <p className="text-dark-400 text-sm mt-2">¿Cómo fue su experiencia?</p>
        </div>

        <Card className="glass">
          <CardContent className="p-6 space-y-6">
            {/* Stars */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onMouseEnter={() => setHoveredScore(i)}
                  onMouseLeave={() => setHoveredScore(0)}
                  onClick={() => setScore(i)}
                  className="cursor-pointer p-1"
                >
                  <Star
                    className={`w-10 h-10 transition-all ${
                      i <= (hoveredScore || score)
                        ? 'text-gold-400 fill-gold-400'
                        : 'text-dark-600'
                    }`}
                  />
                </motion.button>
              ))}
            </div>
            {score > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-dark-300"
              >
                {score === 1 && 'Muy malo'}
                {score === 2 && 'Malo'}
                {score === 3 && 'Regular'}
                {score === 4 && 'Bueno'}
                {score === 5 && 'Excelente'}
              </motion.p>
            )}

            {/* Comment */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comentario opcional..."
              maxLength={300}
              className="w-full h-24 rounded-xl border border-dark-600 bg-dark-800 px-4 py-3 text-sm text-dark-50 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none"
            />

            <Button
              onClick={submitRating}
              className="w-full"
              disabled={score === 0 || loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enviar Calificación
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
