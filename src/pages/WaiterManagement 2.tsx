import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Plus, Trash2, Users, Loader2, UserCheck, UserX } from 'lucide-react'
import type { Profile } from '@/lib/types'

export default function WaiterManagement() {
  const { profile } = useAuth()
  const [waiters, setWaiters] = useState<Profile[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })

  useEffect(() => {
    if (profile?.restaurant_id) loadWaiters()
  }, [profile])

  async function loadWaiters() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('restaurant_id', profile!.restaurant_id!)
      .eq('role', 'waiter')
      .order('full_name')
    setWaiters(data || [])
  }

  async function createWaiter(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })
    if (authError || !authData.user) {
      setLoading(false)
      return
    }
    await supabase.from('profiles').insert({
      id: authData.user.id,
      full_name: form.full_name,
      role: 'waiter',
      restaurant_id: profile!.restaurant_id!,
    })
    setForm({ email: '', password: '', full_name: '' })
    setShowCreate(false)
    loadWaiters()
    setLoading(false)
  }

  async function toggleActive(waiter: Profile) {
    await supabase
      .from('profiles')
      .update({ is_active: !waiter.is_active })
      .eq('id', waiter.id)
    loadWaiters()
  }

  async function deleteWaiter(id: string) {
    if (!confirm('¿Eliminar este mesero? También se eliminarán sus asignaciones de mesas.')) return
    await supabase.from('waiter_assignments').delete().eq('waiter_id', id)
    await supabase.from('profiles').delete().eq('id', id)
    loadWaiters()
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold gold-text">Meseros</h1>
          <p className="text-dark-400 mt-1">Gestione el personal de servicio</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Mesero
        </Button>
      </div>

      {waiters.length === 0 ? (
        <Card className="glass">
          <CardContent className="py-16 text-center">
            <Users className="w-12 h-12 text-dark-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-dark-300">No hay meseros</h3>
            <p className="text-dark-500 text-sm mt-1">Registre su primer mesero para asignarle mesas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {waiters.map((w, i) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={`glass transition-all ${w.is_active ? 'hover:border-gold-500/30' : 'opacity-60'}`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full gold-gradient flex items-center justify-center text-lg font-bold text-dark-900">
                      {w.full_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{w.full_name}</p>
                      <Badge variant={w.is_active ? 'success' : 'secondary'} className="mt-1">
                        {w.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActive(w)}
                        className={w.is_active ? 'text-green-400 hover:text-yellow-400' : 'text-dark-400 hover:text-green-400'}
                        title={w.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {w.is_active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="text-dark-400 hover:text-red-400" onClick={() => deleteWaiter(w.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Mesero</DialogTitle>
            <DialogDescription>Cree una cuenta para el mesero</DialogDescription>
          </DialogHeader>
          <form onSubmit={createWaiter} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-200">Nombre completo *</label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="María García" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-200">Correo electrónico *</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="mesero@restaurante.com" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-200">Contraseña *</label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" required minLength={6} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Crear Mesero
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
