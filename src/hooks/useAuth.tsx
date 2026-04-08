import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MASTER_CODE } from '@/lib/utils'
import type { Session } from '@/lib/types'

interface AuthContextType {
  session: Session | null
  loading: boolean
  login: (code: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const SESSION_KEY = 'serviqr_session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore session from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      if (stored) {
        setSession(JSON.parse(stored))
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY)
    }
    setLoading(false)
  }, [])

  const login = async (code: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = code.trim().toUpperCase()

    // 1. Check master code
    if (trimmed === MASTER_CODE) {
      const s: Session = { role: 'super_admin' }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
      setSession(s)
      return { success: true }
    }

    // 2. Check restaurant access code
    try {
      const rq = query(collection(db, 'restaurants'), where('access_code', '==', trimmed))
      const rSnap = await getDocs(rq)

      if (!rSnap.empty) {
        const rDoc = rSnap.docs[0]
        const data = rDoc.data()
        const s: Session = {
          role: 'restaurant_admin',
          restaurantId: rDoc.id,
          restaurantName: data.name,
        }
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
        setSession(s)
        return { success: true }
      }
    } catch (err) {
      console.error('Error checking restaurant code:', err)
      return { success: false, error: 'Error de conexión. Inténtalo de nuevo.' }
    }

    // 3. Check waiter access code (iterate each restaurant's waiters)
    try {
      const allRestaurants = await getDocs(collection(db, 'restaurants'))

      for (const rDoc of allRestaurants.docs) {
        const wq = query(
          collection(db, `restaurants/${rDoc.id}/waiters`),
          where('access_code', '==', trimmed)
        )
        const wSnap = await getDocs(wq)

        if (!wSnap.empty) {
          const waiterDoc = wSnap.docs[0]
          const waiterData = waiterDoc.data()

          // Check if waiter is active
          if (!waiterData.is_active) {
            return { success: false, error: 'Esta cuenta de mesero está desactivada' }
          }

          const s: Session = {
            role: 'waiter',
            restaurantId: rDoc.id,
            restaurantName: rDoc.data().name,
            waiterId: waiterDoc.id,
            waiterName: waiterData.name,
          }
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
          setSession(s)
          return { success: true }
        }
      }
    } catch (err) {
      console.error('Error checking waiter code:', err)
    }

    return { success: false, error: 'Código no válido' }
  }

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
