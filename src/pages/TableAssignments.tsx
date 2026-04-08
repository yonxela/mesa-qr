import { useAuth } from '@/hooks/useAuth'
import { useCollection } from '@/hooks/useCollection'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Table, Waiter } from '@/lib/types'
import { toast } from 'sonner'

export default function TableAssignments() {
  const { session } = useAuth()
  const rid = session?.restaurantId || ''
  const { data: tables } = useCollection<Table>(`restaurants/${rid}/tables`, [], !!rid)
  const { data: waiters } = useCollection<Waiter>(`restaurants/${rid}/waiters`, [], !!rid)

  const sortedTables = [...tables].sort((a, b) => a.number - b.number)
  const activeWaiters = waiters.filter(w => w.is_active)

  const assignWaiter = async (tableId: string, waiterId: string | null) => {
    try {
      await updateDoc(doc(db, `restaurants/${rid}/tables`, tableId), {
        assigned_waiter_id: waiterId,
      })
      toast.success('Asignación actualizada')
    } catch (err) {
      console.error(err)
      toast.error('Error al asignar')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Asignaciones</h1>
        <p className="text-sm text-zinc-500 mt-1">Asigna meseros a mesas</p>
      </div>

      {sortedTables.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p>No hay mesas creadas. Ve a la sección de Mesas primero.</p>
        </div>
      ) : activeWaiters.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p>No hay meseros activos. Ve a la sección de Meseros primero.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mesa</th>
                <th>Estado</th>
                <th>Mesero Asignado</th>
              </tr>
            </thead>
            <tbody>
              {sortedTables.map((table) => (
                <tr key={table.id}>
                  <td className="font-semibold">Mesa {table.number}</td>
                  <td>
                    <span className={`badge ${table.status === 'available' ? 'bg-emerald-500/20 text-emerald-400' : table.status === 'occupied' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                      {table.status === 'available' ? 'Disponible' : table.status === 'occupied' ? 'Ocupada' : 'Atención'}
                    </span>
                  </td>
                  <td>
                    <select
                      value={table.assigned_waiter_id || ''}
                      onChange={(e) => assignWaiter(table.id, e.target.value || null)}
                      className="input-dark w-48"
                    >
                      <option value="">— Sin asignar —</option>
                      {activeWaiters.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
