import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/lib/types'
import {
  LayoutDashboard, Store, UtensilsCrossed, Users, ArrowLeftRight,
  Radio, BarChart3, LogOut, QrCode
} from 'lucide-react'

interface Props {
  allowedRoles: UserRole[]
}

const superAdminLinks = [
  { to: '/super-admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/super-admin/restaurants', icon: Store, label: 'Restaurantes' },
]

const restaurantAdminLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/tables', icon: UtensilsCrossed, label: 'Mesas' },
  { to: '/dashboard/waiters', icon: Users, label: 'Meseros' },
  { to: '/dashboard/assignments', icon: ArrowLeftRight, label: 'Asignaciones' },
  { to: '/dashboard/live', icon: Radio, label: 'En Vivo' },
  { to: '/dashboard/analytics', icon: BarChart3, label: 'Analíticas' },
]

export function DashboardLayout({ allowedRoles }: Props) {
  const { session, loading, logout } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session || !allowedRoles.includes(session.role)) {
    return <Navigate to="/" replace />
  }

  const links = session.role === 'super_admin' ? superAdminLinks : restaurantAdminLinks

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen flex bg-dark-950">
      {/* Sidebar */}
      <aside className="sidebar w-64 flex flex-col p-4 shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3 px-3 mb-8 mt-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #D4A843, #E8BE5A)' }}
          >
            <QrCode size={18} strokeWidth={2.5} color="#0A0A0B" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">
              Servi<span className="text-gold-400">QR</span>
            </h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
              {session.role === 'super_admin' ? 'Super Admin' : session.restaurantName || 'Admin'}
            </p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col gap-1 flex-1">
          {/* En Vivo first for restaurant admin */}
          {session.role !== 'super_admin' && (
            <>
              <NavLink
                to="/dashboard/live"
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <div className="relative">
                  <Radio size={18} />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                </div>
                En Vivo
              </NavLink>
              <div className="border-t border-zinc-800 my-2" />
            </>
          )}
          {links.filter(l => l.to !== '/dashboard/live').map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/super-admin' || link.to === '/dashboard'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <link.icon size={18} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="sidebar-link text-red-400 hover:text-red-300 hover:bg-red-500/10 mt-auto"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
