import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Printer, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Table, Restaurant } from '@/lib/types'

export default function PrintQRCodes() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [tables, setTables] = useState<Table[]>([])
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)

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

  function handlePrint() {
    window.print()
  }

  const baseUrl = window.location.origin

  return (
    <div>
      {/* Controls - hidden when printing */}
      <div className="print:hidden flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard/tables')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <div>
            <h1 className="font-serif text-2xl font-bold gold-text">Imprimir Códigos QR</h1>
            <p className="text-dark-400 text-sm">{tables.length} mesa{tables.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="w-4 h-4" />
          Imprimir
        </Button>
      </div>

      {/* QR Grid - optimized for print */}
      <div className="grid grid-cols-2 md:grid-cols-3 print:grid-cols-3 gap-6 print:gap-4">
        {tables.map((t) => (
          <div
            key={t.id}
            className="flex flex-col items-center p-6 print:p-4 rounded-2xl print:rounded-none border border-dark-700 print:border print:border-gray-300 bg-dark-800 print:bg-white print:break-inside-avoid"
          >
            <div className="bg-white p-4 rounded-xl print:p-2">
              <QRCodeSVG
                value={`${baseUrl}/r/${restaurant?.slug || ''}/mesa/${t.qr_token}`}
                size={160}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="H"
              />
            </div>
            <div className="mt-3 text-center">
              <p className="font-serif font-bold text-lg print:text-black" style={{ color: restaurant?.primary_color }}>
                {restaurant?.name}
              </p>
              <p className="text-dark-400 print:text-gray-600 text-sm font-medium">
                Mesa {t.number}
              </p>
              {t.label && (
                <p className="text-dark-500 print:text-gray-500 text-xs">{t.label}</p>
              )}
              <p className="text-[10px] text-dark-500 print:text-gray-400 mt-1">
                Escanee para solicitar atención
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
