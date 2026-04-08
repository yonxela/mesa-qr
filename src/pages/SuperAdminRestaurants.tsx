import { useState } from 'react'
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useCollection } from '@/hooks/useCollection'
import { generateAccessCode, slugify } from '@/lib/utils'
import type { Restaurant } from '@/lib/types'
import { Plus, Trash2, Copy, Check, Store } from 'lucide-react'
import { toast } from 'sonner'

export default function SuperAdminRestaurants() {
  const { data: restaurants, loading } = useCollection<Restaurant>('restaurants')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formName, setFormName] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || creating) return
    setCreating(true)

    try {
      const code = generateAccessCode()
      await addDoc(collection(db, 'restaurants'), {
        name: formName.trim(),
        slug: slugify(formName.trim()),
        logo_url: null,
        address: formAddress.trim() || null,
        phone: formPhone.trim() || null,
        primary_color: '#D4A843',
        access_code: code,
        created_at: new Date().toISOString(),
      })
      toast.success(`Restaurante creado. Código: ${code}`)
      setShowCreateModal(false)
      setFormName('')
      setFormAddress('')
      setFormPhone('')
    } catch (err) {
      console.error(err)
      toast.error('Error al crear restaurante')
    }
    setCreating(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"? Se borrarán todas sus mesas, meseros y solicitudes.`)) return
    try {
      await deleteDoc(doc(db, 'restaurants', id))
      toast.success('Restaurante eliminado')
    } catch (err) {
      console.error(err)
      toast.error('Error al eliminar')
    }
  }

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Restaurantes</h1>
          <p className="text-sm text-zinc-500 mt-1">Gestiona los restaurantes registrados</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-gold flex items-center gap-2">
          <Plus size={16} />
          Nuevo Restaurante
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-20">
          <Store size={48} className="mx-auto text-zinc-700 mb-4" />
          <p className="text-zinc-500">No hay restaurantes registrados</p>
          <p className="text-sm text-zinc-600 mt-1">Crea el primero con el botón de arriba</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurants.map((r) => (
            <div key={r.id} className="stat-card flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{r.name}</h3>
                  {r.address && <p className="text-xs text-zinc-500 mt-1">{r.address}</p>}
                </div>
                <button
                  onClick={() => handleDelete(r.id, r.name)}
                  className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Access Code */}
              <div className="flex items-center gap-2 bg-dark-900 rounded-lg px-3 py-2">
                <span className="text-xs text-zinc-500">Código:</span>
                <span className="font-mono font-bold text-gold-400 tracking-wider flex-1">{r.access_code}</span>
                <button
                  onClick={() => copyCode(r.id, r.access_code)}
                  className="p-1 text-zinc-500 hover:text-gold-400 transition-colors"
                >
                  {copiedId === r.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>

              {r.phone && (
                <p className="text-xs text-zinc-500">📞 {r.phone}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-5">Nuevo Restaurante</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Nombre *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: La Parrilla de Juan"
                  className="input-dark"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Dirección</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Ej: Zona 10, Ciudad de Guatemala"
                  className="input-dark"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Teléfono</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Ej: 5555-1234"
                  className="input-dark"
                />
              </div>

              <p className="text-xs text-zinc-500 bg-dark-900 rounded-lg p-3">
                📋 Se generará automáticamente un código de acceso de 6 caracteres (3 letras + 3 números)
              </p>

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-outline flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={!formName.trim() || creating} className="btn-gold flex-1">
                  {creating ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
