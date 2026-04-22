import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar } from './Sidebar'
import type { UserRole } from '@/lib/types'

interface DashboardLayoutProps {
  allowedRoles: UserRole[]
}

export function DashboardLayout({ allowedRoles }: DashboardLayoutProps) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(profile.role)) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen bg-dark-900">
      <Sidebar />
      <main className="lg:ml-64 p-4 pt-16 lg:p-8 lg:pt-8">
        <Outlet />
      </main>
    </div>
  )
}
