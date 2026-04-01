import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeftRight, Check, X } from 'lucide-react'
import type { Profile, Table, WaiterAssignment } from '@/lib/types'

export default function TableAssignments() {
  const { profile } = useAuth()
  const [waiters, setWaiters] = useState<Profile[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [assignments, setAssignments] = useState<WaiterAssignment[]>([])
  const [selectedWaiter, setSelectedWaiter] = useState<string | null>(null)

  useEffect(() => {
    if (profile?.restaurant_id) loadData()
  }, [profile])

  async function loadData() {
    const rid = profile!.restaurant_id!
    const [w, t, a] = await Promise.all([
      supabase.from('profiles').select('*').eq('restaurant_id', rid).eq('role', 'waiter').eq('is_active', true).order('full_name'),
      supabase.from('tables').select('*').eq('restaurant_id', rid).order('number'),
      supabase.from('waiter_assignments').select('*'),
    ])
    setWaiters(w.data || [])
    setTables(t.data || [])
    setAssignments(a.data || [])
    if ((w.data || []).length > 0 && !selectedWaiter) {
      setSelectedWaiter(w.data![0].id)
    }
  }

  function isAssigned(waiterId: string, tableId: string) {
    return assignments.some(a => a.waiter_id === waiterId && a.table_id === tableId)
  }

  function getAssignedWaiter(tableId: string) {
    const a = assignments.find(a => a.table_id === tableId)
    if (!a) return null
    return waiters.find(w => w.id === a.waiter_id) || null
  }

  async function toggleAssignment(tableId: string) {
    if (!selectedWaiter) return
    const existing = assignments.find(a => a.waiter_id === selectedWaiter && a.table_id === tableId)
    if (existing) {
      await supabase.from('waiter_assignments').delete().eq('id', existing.id)
    } else {
      // Remove any existing assignment for this table first
      const otherAssignment = assignments.find(a => a.table_id === tableId)
      if (otherAssignment) {
        await supabase.from('waiter_assignments').delete().eq('id', otherAssignment.id)
      }
      await supabase.from('waiter_assignments').insert({
        waiter_id: selectedWaiter,
        table_id: tableId,
      })
    }
    loadData()
  }

  const selectedWaiterData = waiters.find(w => w.id === selectedWaiter)
  const assignedCount = assignments.filter(a => a.waiter_id === selectedWaiter).length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold gold-text">Asignaciones</h1>
        <p className="text-dark-400 mt-1">Asigne mesas a cada mesero</p>
      </div>

      {waiters.length === 0 || tables.length === 0 ? (
        <Card className="glass">
          <CardContent className="py-16 text-center">
            <ArrowLeftRight className="w-12 h-12 text-dark-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-dark-300">
              {waiters.length === 0 ? 'No hay meseros activos' : 'No hay mesas creadas'}
            </h3>
            <p className="text-dark-500 text-sm mt-1">
              Necesita al menos un mesero activo y una mesa para hacer asignaciones
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Waiter Selector */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-dark-300 uppercase tracking-wide">Meseros</h3>
            {waiters.map((w) => {
              const count = assignments.filter(a => a.waiter_id === w.id).length
              return (
                <button
                  key={w.id}
                  onClick={() => setSelectedWaiter(w.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                    selectedWaiter === w.id
                      ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400'
                      : 'bg-dark-800 border border-dark-700 text-dark-300 hover:border-dark-600'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-sm font-bold text-dark-900 shrink-0">
                    {w.full_name.charAt(0)}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{w.full_name}</p>
                    <p className="text-xs opacity-60">{count} mesa{count !== 1 ? 's' : ''}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Table Grid */}
          <div className="lg:col-span-3">
            {selectedWaiterData && (
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-gold-500/5 border border-gold-500/10">
                <p className="text-sm">
                  Seleccione las mesas para <strong className="text-gold-400">{selectedWaiterData.full_name}</strong>
                </p>
                <Badge variant="default">{assignedCount} asignada{assignedCount !== 1 ? 's' : ''}</Badge>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {tables.map((t, i) => {
                const assigned = selectedWaiter ? isAssigned(selectedWaiter, t.id) : false
                const assignedTo = getAssignedWaiter(t.id)
                const isOtherWaiter = assignedTo && assignedTo.id !== selectedWaiter

                return (
                  <motion.button
                    key={t.id}
                    onClick={() => toggleAssignment(t.id)}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={`relative p-4 rounded-xl border-2 transition-all text-center cursor-pointer ${
                      assigned
                        ? 'border-gold-400 bg-gold-500/10'
                        : isOtherWaiter
                        ? 'border-dark-600 bg-dark-700/50 opacity-60'
                        : 'border-dark-700 bg-dark-800 hover:border-dark-500'
                    }`}
                  >
                    {assigned && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gold-400 flex items-center justify-center">
                        <Check className="w-3 h-3 text-dark-900" />
                      </div>
                    )}
                    <p className="text-2xl font-bold mb-1">{t.number}</p>
                    <p className="text-xs text-dark-400">{t.label || `Mesa ${t.number}`}</p>
                    {isOtherWaiter && (
                      <p className="text-[10px] text-dark-500 mt-1">{assignedTo!.full_name}</p>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
