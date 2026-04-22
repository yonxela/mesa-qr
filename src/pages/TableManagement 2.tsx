import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { TABLE_STATUS } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Plus, Trash2, QrCode, Printer, Loader2 } from 'lucide-react'
import type { Table, Restaurant } from '@/lib/types'

export default function TableManagement() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [tables, setTables] = useState<Table[]>([])
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showQR, setShowQR] = useState<Table | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ number: '', label: '' })
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (profile?.restaurant_id) loadData()
  }, [profile])

  async function loadData() {
    const rid = profile!.restaurant_id!
    const [t, r] = await Promise.all([
      supabase.from('tables').select('*').eq('restaurant_id', rid).order('number'),
      supabase.from('restaurants').select('*').eq('id', rid).single(),
    ])
    setTables(t.data || [])
    setRestaurant(r.data)
  }

  async function createTable(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.from('tables').insert({
      restaurant_id: profile!.restaurant_id!,
      number: parseInt(form.number),
      label: form.label || null,
    })
    setForm({ number: '', label: '' })
    setShowCreate(false)
    loadData()
    setLoading(false)
  }

  async function deleteTable(id: string) {
    if (!confirm('¿Eliminar esta mesa?')) return
    await supabase.from('tables').delete().eq('id', id)
    loadData()
  }

  function getQRUrl(table: Table) {
    const base = window.location.origin
    return `${base}/r/${restaurant?.slug || 'demo'}/mesa/${table.qr_token}`
  }

  function printQR() {
    const content = printRef.current
    if (!content) return
    const win = window.open('', '', 'width=400,height=600')
    if (!win) return
    win.document.write(`
      <html><head><title>QR Mesa</title>
      <style>
        body { font-family: sans-serif; text-align: center; padding: 40px; }
        .qr-container { display: inline-block; padding: 30px; border: 2px solid #C6A961; border-radius: 16px; }
        h2 { color: #333; margin-bottom: 8px; }
        p { color: #666; font-size: 14px; }
      </style></head><body>
      ${content.innerHTML}
      <script>window.print(); window.close();</script>
      </body></html>
    `)
    win.document.close()
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold gold-text">Mesas</h1>
          <p className="text-dark-400 mt-1">Gestione las mesas y códigos QR</p>
        </div>
        <div className="flex items-center gap-3">
          {tables.length > 0 && (
            <Button variant="outline" onClick={() => navigate('/dashboard/tables/print')} className="gap-2">
              <Printer className="w-4 h-4" />
              Imprimir Todos
            </Button>
          )}
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva Mesa
          </Button>
        </div>
      </div>

      {tables.length === 0 ? (
        <Card className="glass">
          <CardContent className="py-16 text-center">
            <QrCode className="w-12 h-12 text-dark-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-dark-300">No hay mesas</h3>
            <p className="text-dark-500 text-sm mt-1">Cree su primera mesa para generar códigos QR</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map((t, i) => {
            const statusInfo = TABLE_STATUS[t.status] || TABLE_STATUS.available
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="glass hover:border-gold-500/30 transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-dark-700 flex items-center justify-center text-lg font-bold gold-text">
                          {t.number}
                        </div>
                        <div>
                          <p className="font-medium">Mesa {t.number}</p>
                          {t.label && <p className="text-xs text-dark-400">{t.label}</p>}
                        </div>
                      </div>
                      <Badge variant={
                        t.status === 'available' ? 'success' :
                        t.status === 'occupied' ? 'warning' : 'danger'
                      }>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => setShowQR(t)}>
                        <QrCode className="w-3 h-3" />
                        Ver QR
                      </Button>
                      <Button variant="ghost" size="icon" className="text-dark-400 hover:text-red-400" onClick={() => deleteTable(t.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create Table Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Mesa</DialogTitle>
            <DialogDescription>Asigne un número a la nueva mesa</DialogDescription>
          </DialogHeader>
          <form onSubmit={createTable} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-200">Número de mesa *</label>
              <Input type="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="1" required min="1" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-200">Etiqueta (opcional)</label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Terraza, VIP, etc." />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Crear Mesa
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!showQR} onOpenChange={() => setShowQR(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Mesa {showQR?.number}</DialogTitle>
            <DialogDescription>Escanee o imprima este código</DialogDescription>
          </DialogHeader>
          {showQR && (
            <div className="text-center space-y-4">
              <div ref={printRef} className="inline-block p-6 bg-white rounded-2xl">
                <QRCodeSVG
                  value={getQRUrl(showQR)}
                  size={220}
                  bgColor="#FFFFFF"
                  fgColor="#0A0A0A"
                  level="H"
                  includeMargin={false}
                />
                <div className="mt-3">
                  <h2 style={{ color: '#333', margin: 0, fontSize: '18px' }}>{restaurant?.name}</h2>
                  <p style={{ color: '#666', fontSize: '14px', margin: '4px 0 0' }}>Mesa {showQR.number}</p>
                </div>
              </div>
              <p className="text-xs text-dark-400 break-all px-4">{getQRUrl(showQR)}</p>
              <Button onClick={printQR} className="gap-2">
                <Printer className="w-4 h-4" />
                Imprimir QR
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
