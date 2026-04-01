import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { slugify } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Building2, Trash2, UserPlus, Loader2 } from 'lucide-react'
import type { Restaurant, Profile } from '@/lib/types'

export default function SuperAdminRestaurants() {
  const { user } = useAuth()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [admins, setAdmins] = useState<Record<string, Profile[]>>({})
  const [showCreate, setShowCreate] = useState(false)
  const [showAddAdmin, setShowAddAdmin] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', phone: '', primary_color: '#C6A961' })
  const [adminForm, setAdminForm] = useState({ email: '', password: '', full_name: '' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data } = await supabase.from('restaurants').select('*').order('created_at', { ascending: false })
    setRestaurants(data || [])
    if (data) {
      const adminMap: Record<string, Profile[]> = {}
      for (const r of data) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .eq('restaurant_id', r.id)
          .eq('role', 'restaurant_admin')
        adminMap[r.id] = profiles || []
      }
      setAdmins(adminMap)
    }
  }

  async function createRestaurant(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    const slug = slugify(form.name)
    const { error } = await supabase.from('restaurants').insert({
      name: form.name,
      slug,
      address: form.address || null,
      phone: form.phone || null,
      primary_color: form.primary_color,
      owner_id: user.id,
    })
    if (!error) {
      setForm({ name: '', address: '', phone: '', primary_color: '#C6A961' })
      setShowCreate(false)
      loadData()
    }
    setLoading(false)
  }

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault()
    if (!showAddAdmin) return
    setLoading(true)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminForm.email,
      password: adminForm.password,
    })

    if (authError || !authData.user) {
      setLoading(false)
      return
    }

    await supabase.from('profiles').insert({
      id: authData.user.id,
      full_name: adminForm.full_name,
      role: 'restaurant_admin',
      restaurant_id: showAddAdmin,
    })

    setAdminForm({ email: '', password: '', full_name: '' })
    setShowAddAdmin(null)
    loadData()
    setLoading(false)
  }

  async function deleteRestaurant(id: string) {
    if (!confirm('¿Está seguro de eliminar este restaurante? Se eliminarán todas las mesas, meseros y solicitudes asociadas.')) return
    await supabase.from('restaurants').delete().eq('id', id)
    loadData()
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold gold-text">Restaurantes</h1>
          <p className="text-dark-400 mt-1">Gestione todos los restaurantes del sistema</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Restaurante
        </Button>
      </div>

      {restaurants.length === 0 ? (
        <Card className="glass">
          <CardContent className="py-16 text-center">
            <Building2 className="w-12 h-12 text-dark-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-dark-300">No hay restaurantes</h3>
            <p className="text-dark-500 text-sm mt-1">Cree su primer restaurante para comenzar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {restaurants.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="glass hover:border-gold-500/30 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold font-serif"
                        style={{ backgroundColor: r.primary_color + '20', color: r.primary_color }}
                      >
                        {r.name.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{r.name}</CardTitle>
                        <p className="text-xs text-dark-400 mt-0.5">{r.address || 'Sin dirección'}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteRestaurant(r.id)} className="text-dark-400 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-400">Slug:</span>
                      <code className="text-gold-400 bg-dark-700 px-2 py-0.5 rounded text-xs">{r.slug}</code>
                    </div>
                    {r.phone && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-dark-400">Teléfono:</span>
                        <span>{r.phone}</span>
                      </div>
                    )}
                    <div className="border-t border-dark-700 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-dark-400">Administradores</span>
                        <Button variant="ghost" size="sm" onClick={() => setShowAddAdmin(r.id)} className="gap-1 text-xs">
                          <UserPlus className="w-3 h-3" />
                          Agregar
                        </Button>
                      </div>
                      {(admins[r.id] || []).length === 0 ? (
                        <p className="text-xs text-dark-500">Sin administradores asignados</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {(admins[r.id] || []).map((a) => (
                            <Badge key={a.id} variant="secondary">{a.full_name}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Restaurant Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Restaurante</DialogTitle>
            <DialogDescription>Complete la información del restaurante</DialogDescription>
          </DialogHeader>
          <form onSubmit={createRestaurant} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-200">Nombre *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mi Restaurante" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-200">Dirección</label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Av. Principal #123" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-200">Teléfono</label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 890" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-200">Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="w-11 h-11 rounded-xl border border-dark-600 bg-dark-800 cursor-pointer" />
                  <Input value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="font-mono text-xs" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Crear Restaurante
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Admin Dialog */}
      <Dialog open={!!showAddAdmin} onOpenChange={() => setShowAddAdmin(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Administrador</DialogTitle>
            <DialogDescription>Cree una cuenta de administrador para este restaurante</DialogDescription>
          </DialogHeader>
          <form onSubmit={createAdmin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-200">Nombre completo *</label>
              <Input value={adminForm.full_name} onChange={(e) => setAdminForm({ ...adminForm, full_name: e.target.value })} placeholder="Juan Pérez" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-200">Correo electrónico *</label>
              <Input type="email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} placeholder="admin@restaurante.com" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-200">Contraseña *</label>
              <Input type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} placeholder="Mínimo 6 caracteres" required minLength={6} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setShowAddAdmin(null)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Crear Administrador
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
