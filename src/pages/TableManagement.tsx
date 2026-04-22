import { useState, useRef } from 'react'
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useCollection } from '@/hooks/useCollection'
import { generateQRToken, TABLE_STATUS } from '@/lib/utils'
import type { Table, Waiter } from '@/lib/types'
import { Plus, Trash2, Printer, User, X, UserCheck, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'

export default function TableManagement() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const rid = session?.restaurantId || ''
  const { data: tables, loading } = useCollection<Table>(`restaurants/${rid}/tables`, [], !!rid)
  const { data: waiters } = useCollection<Waiter>(`restaurants/${rid}/waiters`, [], !!rid)
  const [creating, setCreating] = useState(false)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)

  const sortedTables = [...tables].sort((a, b) => a.number - b.number)
  const activeWaiters = waiters.filter(w => w.is_active)

  // Map waiter IDs to names for quick lookup
  const waiterMap = new Map(waiters.map(w => [w.id, w]))

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

  const handleDelete = async (e: React.MouseEvent, table: Table) => {
    e.stopPropagation()
    if (!confirm(`¿Eliminar Mesa ${table.number}?`)) return
    try {
      await deleteDoc(doc(db, `restaurants/${rid}/tables`, table.id))
      toast.success(`Mesa ${table.number} eliminada`)
    } catch (err) {
      console.error(err)
      toast.error('Error al eliminar')
    }
  }

  const toggleStatus = async (e: React.MouseEvent, table: Table) => {
    e.stopPropagation()
    const next = table.status === 'available' ? 'occupied'
      : table.status === 'occupied' ? 'needs_attention'
      : 'available'
    try {
      await updateDoc(doc(db, `restaurants/${rid}/tables`, table.id), { status: next })
    } catch (err) {
      console.error(err)
    }
  }

  const assignWaiter = async (waiterId: string | null) => {
    if (!selectedTable) return
    try {
      await updateDoc(doc(db, `restaurants/${rid}/tables`, selectedTable.id), {
        assigned_waiter_id: waiterId,
      })
      const waiterName = waiterId ? waiterMap.get(waiterId)?.name : null
      toast.success(waiterId
        ? `${waiterName} asignado a Mesa ${selectedTable.number}`
        : `Mesa ${selectedTable.number} sin mesero asignado`
      )
      setSelectedTable(null)
    } catch (err) {
      console.error(err)
      toast.error('Error al asignar mesero')
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
            const assignedWaiter = table.assigned_waiter_id
              ? waiterMap.get(table.assigned_waiter_id)
              : null
            return (
              <div
                key={table.id}
                className="stat-card text-center relative group cursor-pointer hover:border-gold-500/40 transition-all"
                onClick={() => setSelectedTable(table)}
              >
                {/* Delete */}
                <button
                  onClick={(e) => handleDelete(e, table)}
                  className="absolute top-2 right-2 p-1 rounded text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>

                {/* Number */}
                <p className="text-3xl font-bold mb-1">{table.number}</p>
                <p className="text-xs text-zinc-500 mb-2">{table.label || `Mesa ${table.number}`}</p>

                {/* Assigned waiter */}
                <div className="flex items-center justify-center gap-1.5 mb-3 min-h-[20px]">
                  {assignedWaiter ? (
                    <>
                      <User size={12} className="text-gold-400" />
                      <span className="text-[11px] text-gold-400 font-medium truncate max-w-[90px]">
                        {assignedWaiter.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] text-zinc-600 italic">Sin mesero</span>
                  )}
                </div>

                {/* Status badge */}
                <button
                  onClick={(e) => toggleStatus(e, table)}
                  className={`badge ${statusInfo.color} text-white text-[10px] cursor-pointer hover:scale-105 transition-transform`}
                >
                  {statusInfo.label}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Assign Waiter Modal */}
      {selectedTable && (
        <div className="modal-overlay" onClick={() => setSelectedTable(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold">Mesa {selectedTable.number}</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Gestionar mesa</p>
              </div>
              <button onClick={() => setSelectedTable(null)} className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* QR Code Preview */}
            <div className="bg-white rounded-xl p-4 flex flex-col items-center mb-5" id={`qr-print-${selectedTable.id}`}>
              <QRCodeSVG
                value={`${window.location.origin}/r/${(session?.restaurantName || rid).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}mesa/${selectedTable.qr_token}`}
                size={140}
                level="H"
                includeMargin
              />
              <p className="text-black font-bold text-sm mt-1">Mesa {selectedTable.number}</p>
              <p className="text-gray-500 text-[10px]">{session?.restaurantName}</p>
            </div>

            <button
              onClick={() => {
                const printWindow = window.open('', '_blank', 'width=400,height=500')
                if (!printWindow) return
                const slug = (session?.restaurantName || rid).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                const qrUrl = `${window.location.origin}/r/${slug}/mesa/${selectedTable.qr_token}`
                printWindow.document.write(`
                  <html><head><title>QR Mesa ${selectedTable.number}</title>
                  <style>
                    body { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; margin:0; font-family:system-ui,sans-serif; }
                    .card { text-align:center; padding:40px; }
                    h2 { margin:16px 0 4px; font-size:24px; }
                    p { color:#666; margin:0; font-size:14px; }
                    .scan { font-size:11px; color:#999; margin-top:8px; }
                  </style></head><body>
                  <div class="card">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}" width="250" height="250" />
                    <h2>Mesa ${selectedTable.number}</h2>
                    <p>${session?.restaurantName || ''}</p>
                    <p class="scan">Escanea para solicitar servicio</p>
                  </div>
                  <script>setTimeout(()=>{window.print();window.close()},500)<\/script>
                  </body></html>
                `)
                printWindow.document.close()
              }}
              className="btn-outline w-full flex items-center justify-center gap-2 mb-5"
            >
              <Printer size={16} />
              Imprimir QR de esta mesa
            </button>

            {/* Waiter assignment section */}
            <p className="text-xs text-zinc-500 font-medium mb-3 uppercase tracking-wider">Mesero Responsable</p>

            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {/* Option: No waiter */}
              <button
                onClick={() => assignWaiter(null)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left
                  ${!selectedTable.assigned_waiter_id
                    ? 'bg-zinc-800 border border-zinc-700'
                    : 'hover:bg-zinc-800/50 border border-transparent'
                  }`}
              >
                <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center">
                  <X size={14} className="text-zinc-500" />
                </div>
                <span className="text-sm text-zinc-400">Sin mesero asignado</span>
                {!selectedTable.assigned_waiter_id && (
                  <UserCheck size={16} className="ml-auto text-gold-400" />
                )}
              </button>

              {activeWaiters.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">No hay meseros activos</p>
              ) : (
                activeWaiters.map((w) => {
                  const isAssigned = selectedTable.assigned_waiter_id === w.id
                  return (
                    <button
                      key={w.id}
                      onClick={() => assignWaiter(w.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left
                        ${isAssigned
                          ? 'bg-gold-500/10 border border-gold-500/30'
                          : 'hover:bg-zinc-800/50 border border-transparent'
                        }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        isAssigned ? 'bg-gold-500/20 text-gold-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {w.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isAssigned ? 'text-gold-400' : ''}`}>{w.name}</p>
                        <p className="text-[11px] text-zinc-500">Código: {w.access_code}</p>
                      </div>
                      {isAssigned && (
                        <UserCheck size={16} className="text-gold-400 shrink-0" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
