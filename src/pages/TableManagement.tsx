import { useState } from 'react'
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useCollection } from '@/hooks/useCollection'
import { generateQRToken, TABLE_STATUS } from '@/lib/utils'
import type { Table } from '@/lib/types'
import { Plus, Trash2, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export default function TableManagement() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const rid = session?.restaurantId || ''
  const { data: tables, loading } = useCollection<Table>(`restaurants/${rid}/tables`, [], !!rid)
  const [creating, setCreating] = useState(false)

  const sortedTables = [...tables].sort((a, b) => a.number - b.number)

  const handleAddTable = async () => {
    if (creating) return
    setCreating(true)
    try {
      const nextNum = tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1
      await addDoc(collection(db, `restaurants/${rid}/tables`), {
        restaurant_id: rid,
        number: nextNum,
        label: null,
        qr_token: generateQRToken(),
        status: 'available',
        assigned_waiter_id: null,
        created_at: new Date().toISOString(),
      })
      toast.success(`Mesa ${nextNum} creada`)
    } catch (err) {
      console.error(err)
      toast.error('Error al crear mesa')
    }
    setCreating(false)
  }

  const handleDelete = async (table: Table) => {
    if (!confirm(`¿Eliminar Mesa ${table.number}?`)) return
    try {
      await deleteDoc(doc(db, `restaurants/${rid}/tables`, table.id))
      toast.success(`Mesa ${table.number} eliminada`)
    } catch (err) {
      console.error(err)
      toast.error('Error al eliminar')
    }
  }

  const toggleStatus = async (table: Table) => {
    const next = table.status === 'available' ? 'occupied'
      : table.status === 'occupied' ? 'needs_attention'
      : 'available'
    try {
      await updateDoc(doc(db, `restaurants/${rid}/tables`, table.id), { status: next })
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Mesas</h1>
          <p className="text-sm text-zinc-500 mt-1">{tables.length} mesas registradas</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/dashboard/tables/print')} className="btn-outline flex items-center gap-2">
            <Printer size={16} />
            Imprimir QRs
          </button>
          <button onClick={handleAddTable} disabled={creating} className="btn-gold flex items-center gap-2">
            <Plus size={16} />
            {creating ? 'Creando...' : 'Agregar Mesa'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sortedTables.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-lg mb-2">No hay mesas</p>
          <p className="text-sm">Agrega la primera mesa con el botón de arriba</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {sortedTables.map((table) => {
            const statusInfo = TABLE_STATUS[table.status]
            return (
              <div key={table.id} className="stat-card text-center relative group">
                {/* Delete */}
                <button
                  onClick={() => handleDelete(table)}
                  className="absolute top-2 right-2 p-1 rounded text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>

                {/* Number */}
                <p className="text-3xl font-bold mb-2">{table.number}</p>
                <p className="text-xs text-zinc-500 mb-3">{table.label || `Mesa ${table.number}`}</p>

                {/* Status badge */}
                <button
                  onClick={() => toggleStatus(table)}
                  className={`badge ${statusInfo.color} text-white text-[10px] cursor-pointer hover:scale-105 transition-transform`}
                >
                  {statusInfo.label}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
