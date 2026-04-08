import { useState } from 'react'
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useCollection } from '@/hooks/useCollection'
import { generateAccessCode } from '@/lib/utils'
import type { Waiter } from '@/lib/types'
import { Plus, Trash2, UserCheck, UserX, Copy, Check, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export default function WaiterManagement() {
  const { session } = useAuth()
  const rid = session?.restaurantId || ''
  const { data: waiters, loading } = useCollection<Waiter>(`restaurants/${rid}/waiters`, [], !!rid)

  const [showModal, setShowModal] = useState(false)
  const [formName, setFormName] = useState('')
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Waiter | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || creating) return
    setCreating(true)
    try {
      const code = generateAccessCode()
      await addDoc(collection(db, `restaurants/${rid}/waiters`), {
        restaurant_id: rid,
        name: formName.trim(),
        access_code: code,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      toast.success(`Mesero "${formName}" creado. Código: ${code}`)
      setShowModal(false)
      setFormName('')
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

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    try {
      await deleteDoc(doc(db, `restaurants/${rid}/waiters`, deleteTarget.id))
      toast.success('Mesero eliminado')
    } catch (err) {
      console.error(err)
      toast.error('Error al eliminar')
    }
    setDeleting(false)
    setDeleteTarget(null)
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
            <div key={w.id} className={`stat-card flex flex-col gap-3 ${!w.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${w.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                  {w.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{w.name}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => toggleActive(w)}
                    className={`p-2 rounded-lg transition-colors ${w.is_active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-zinc-500 hover:bg-zinc-800'}`}
                    title={w.is_active ? 'Desactivar' : 'Activar'}
                  >
                    {w.is_active ? <UserCheck size={16} /> : <UserX size={16} />}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(w)}
                    className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Access Code */}
              <div className="flex items-center gap-2 bg-dark-900 rounded-lg px-3 py-2">
                <span className="text-xs text-zinc-500">Código:</span>
                <span className="font-mono font-bold text-gold-400 tracking-wider flex-1">{w.access_code}</span>
                <button
                  onClick={() => copyCode(w.id, w.access_code)}
                  className="p-1 text-zinc-500 hover:text-gold-400 transition-colors"
                >
                  {copiedId === w.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <h2 className="text-lg font-bold">Eliminar Mesero</h2>
            </div>
            <p className="text-sm text-zinc-400 mb-6">
              ¿Estás seguro de eliminar a <strong className="text-white">"{deleteTarget.name}"</strong>? Su código de acceso dejará de funcionar.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="btn-outline flex-1">
                Cancelar
              </button>
              <button onClick={confirmDelete} disabled={deleting} className="btn-danger flex-1">
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
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

              <p className="text-xs text-zinc-500 bg-dark-900 rounded-lg p-3">
                📋 Se generará automáticamente un código de acceso para que el mesero pueda ingresar al sistema
              </p>

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">
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
