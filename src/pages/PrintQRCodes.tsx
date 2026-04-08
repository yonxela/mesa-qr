import { useAuth } from '@/hooks/useAuth'
import { useCollection } from '@/hooks/useCollection'
import type { Table } from '@/lib/types'
import { QRCodeSVG } from 'qrcode.react'
import { Printer, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PrintQRCodes() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const rid = session?.restaurantId || ''
  const { data: tables, loading } = useCollection<Table>(`restaurants/${rid}/tables`, [], !!rid)

  const sortedTables = [...tables].sort((a, b) => a.number - b.number)
  const baseUrl = window.location.origin

  // Build QR URL: /r/{slug}/mesa/{qr_token}
  const getQRUrl = (table: Table) => {
    const slug = session?.restaurantName
      ? session.restaurantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      : rid
    return `${baseUrl}/r/${slug}/mesa/${table.qr_token}`
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8 print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard/tables')} className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-dark-800 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Imprimir QRs</h1>
            <p className="text-sm text-zinc-500 mt-1">{sortedTables.length} mesas</p>
          </div>
        </div>
        <button onClick={() => window.print()} className="btn-gold flex items-center gap-2">
          <Printer size={16} />
          Imprimir
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-3 print:gap-4">
          {sortedTables.map((table) => (
            <div key={table.id} className="bg-white rounded-xl p-6 flex flex-col items-center text-center print:p-4 print:break-inside-avoid">
              <QRCodeSVG
                value={getQRUrl(table)}
                size={160}
                level="H"
                includeMargin
              />
              <p className="text-black font-bold text-lg mt-3">Mesa {table.number}</p>
              <p className="text-gray-500 text-xs mt-1">{session?.restaurantName}</p>
              <p className="text-gray-400 text-[10px] mt-1">Escanea para solicitar servicio</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
