import { useEffect, useState } from 'react'
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  type Query,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

/**
 * Generic realtime hook for Firestore collections.
 * Returns live-updating data from Firestore using onSnapshot.
 */
export function useCollection<T>(
  path: string,
  constraints: Parameters<typeof where | typeof orderBy>[] = [],
  enabled = true
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !path) {
      setLoading(false)
      return
    }

    setLoading(true)
    const ref = collection(db, path)
    // Build query with constraints
    const q = constraints.length > 0
      ? query(ref, ...constraints as any[])
      : query(ref)

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[]
        setData(items)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error(`Firestore error on ${path}:`, err)
        setError(err.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [path, enabled])

  return { data, loading, error }
}
