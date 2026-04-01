import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Table2,
  Users,
  ArrowLeftRight,
  BarChart3,
  Radio,
  LogOut,
  Building2,
  ChefHat,
  Menu,
  X,
} from 'lucide-react'

const superAdminLinks = [
  { to: '/super-admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/super-admin/restaurants', icon: Building2, label: 'Restaurantes' },
]

const adminLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/tables', icon: Table2, label: 'Mesas' },
  { to: '/dashboard/waiters', icon: Users, label: 'Meseros' },
  { to: '/dashboard/assignments', icon: ArrowLeftRight, label: 'Asignaciones' },
  { to: '/dashboard/live', icon: Radio, label: 'En Vivo' },
  { to: '/dashboard/analytics', icon: BarChart3, label: 'Analíticas' },
]

export function Sidebar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = profile?.role === 'super_admin' ? superAdminLinks : adminLinks
  const isSuperAdmin = profile?.role === 'super_admin'

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-dark-900" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg gold-text">MeseroQR</h1>
              <p className="text-xs text-dark-400">
                {isSuperAdmin ? 'Super Admin' : 'Administración'}
              </p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 text-dark-400 hover:text-dark-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard' || link.to === '/super-admin'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                  : 'text-dark-300 hover:text-dark-50 hover:bg-dark-700'
              )
            }
          >
            <link.icon className="w-5 h-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-dark-700">
        <div className="flex items-center gap-3 px-4 py-2 mb-3">
          <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-xs font-bold text-dark-900">
            {profile?.full_name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-dark-50 truncate">{profile?.full_name}</p>
            <p className="text-xs text-dark-400 capitalize">{profile?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center text-dark-300 hover:text-dark-50 cursor-pointer"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 h-screen w-64 bg-dark-800 border-r border-dark-700 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {sidebarContent}
      </aside>
    </>
  )
}
