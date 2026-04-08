import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Toaster } from 'sonner'

import Login from '@/pages/Login'
import SuperAdminDashboard from '@/pages/SuperAdminDashboard'
import SuperAdminRestaurants from '@/pages/SuperAdminRestaurants'
import RestaurantDashboard from '@/pages/RestaurantDashboard'
import TableManagement from '@/pages/TableManagement'
import WaiterManagement from '@/pages/WaiterManagement'
import TableAssignments from '@/pages/TableAssignments'
import LiveMonitor from '@/pages/LiveMonitor'
import Analytics from '@/pages/Analytics'
import PrintQRCodes from '@/pages/PrintQRCodes'
import WaiterPanel from '@/pages/WaiterPanel'
import CustomerRequest from '@/pages/CustomerRequest'
import CustomerRating from '@/pages/CustomerRating'

function WaiterProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session || session.role !== 'restaurant_admin') return <Navigate to="/" replace />
  return <WaiterPanel />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* Customer (public, no auth) */}
          <Route path="/r/:slug/mesa/:token" element={<CustomerRequest />} />
          <Route path="/r/:slug/mesa/:token/calificar/:requestId" element={<CustomerRating />} />

          {/* Super Admin */}
          <Route element={<DashboardLayout allowedRoles={['super_admin']} />}>
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/restaurants" element={<SuperAdminRestaurants />} />
          </Route>

          {/* Restaurant Admin */}
          <Route element={<DashboardLayout allowedRoles={['restaurant_admin']} />}>
            <Route path="/dashboard" element={<RestaurantDashboard />} />
            <Route path="/dashboard/tables" element={<TableManagement />} />
            <Route path="/dashboard/waiters" element={<WaiterManagement />} />
            <Route path="/dashboard/assignments" element={<TableAssignments />} />
            <Route path="/dashboard/live" element={<LiveMonitor />} />
            <Route path="/dashboard/analytics" element={<Analytics />} />
            <Route path="/dashboard/tables/print" element={<PrintQRCodes />} />
          </Route>

          {/* Waiter */}
          <Route path="/waiter" element={<WaiterProtectedRoute />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#1A1A1D',
              border: '1px solid #232328',
              color: '#FAFAFA',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
