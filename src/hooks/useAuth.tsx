import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MASTER_CODE } from '@/lib/utils'
import type { Session, UserRole } from '@/lib/types'

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
      const q = query(collection(db, 'restaurants'), where('access_code', '==', trimmed))
      const snap = await getDocs(q)

      if (!snap.empty) {
        const doc = snap.docs[0]
        const data = doc.data()
        const s: Session = {
          role: 'restaurant_admin',
          restaurantId: doc.id,
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
