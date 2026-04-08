import { useState } from 'react'
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useCollection } from '@/hooks/useCollection'
import type { Waiter } from '@/lib/types'
import { Plus, Trash2, UserCheck, UserX } from 'lucide-react'
import { toast } from 'sonner'

export default function WaiterManagement() {
  const { session } = useAuth()
  const rid = session?.restaurantId || ''
  const { data: waiters, loading } = useCollection<Waiter>(`restaurants/${rid}/waiters`, [], !!rid)

  const [showModal, setShowModal] = useState(false)
  const [formName, setFormName] = useState('')
  const [formPin, setFormPin] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formPin.trim() || creating) return
    setCreating(true)
    try {
      await addDoc(collection(db, `restaurants/${rid}/waiters`), {
        restaurant_id: rid,
        name: formName.trim(),
        pin: formPin.trim(),
        is_active: true,
        created_at: new Date().toISOString(),
      })
      toast.success(`Mesero "${formName}" creado`)
      setShowModal(false)
      setFormName('')
      setFormPin('')
    } catch (err) {
      console.error(err)
      toast.error('Error al crear mesero')
    }
    setCreating(false)
  }

  const toggleActive = async (w: Waiter) => {
    try {
      await updateDoc(doc(db, `restaurants/${rid}/waiters`, w.id), { is_active: !w.is_active })
      toast.success(`${w.name} ${!w.is_active ? 'activado' : 'desactivado'}`)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (w: Waiter) => {
    if (!confirm(`¿Eliminar a "${w.name}"?`)) return
    try {
      await deleteDoc(doc(db, `restaurants/${rid}/waiters`, w.id))
      toast.success('Mesero eliminado')
    } catch (err) {
      console.error(err)
      toast.error('Error al eliminar')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Meseros</h1>
          <p className="text-sm text-zinc-500 mt-1">{waiters.filter(w => w.is_active).length} activos de {waiters.length}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-gold flex items-center gap-2">
          <Plus size={16} />
          Nuevo Mesero
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : waiters.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-lg mb-2">No hay meseros</p>
          <p className="text-sm">Agrega el primero con el botón de arriba</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {waiters.map((w) => (
            <div key={w.id} className={`stat-card flex items-center gap-4 ${!w.is_active ? 'opacity-50' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${w.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                {w.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{w.name}</p>
                <p className="text-xs text-zinc-500">PIN: {w.pin}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => toggleActive(w)}
                  className={`p-2 rounded-lg transition-colors ${w.is_active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-zinc-500 hover:bg-zinc-800'}`}
                  title={w.is_active ? 'Desactivar' : 'Activar'}
                >
                  {w.is_active ? <UserCheck size={16} /> : <UserX size={16} />}
                </button>
                <button
                  onClick={() => handleDelete(w)}
                  className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-5">Nuevo Mesero</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Nombre *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Carlos López"
                  className="input-dark"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">PIN *</label>
                <input
                  type="text"
                  value={formPin}
                  onChange={(e) => setFormPin(e.target.value)}
                  placeholder="Ej: 1234"
                  maxLength={6}
                  className="input-dark"
                />
                <p className="text-xs text-zinc-600 mt-1">PIN para identificar al mesero</p>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={!formName.trim() || !formPin.trim() || creating} className="btn-gold flex-1">
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
