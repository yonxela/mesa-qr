import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Time helpers ───
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

export function getTimeDiffMinutes(from: string, to?: string): number {
  const start = new Date(from).getTime()
  const end = to ? new Date(to).getTime() : Date.now()
  return Math.round((end - start) / 60000)
}

export function getTimeDiffSeconds(from: string, to?: string): number {
  const start = new Date(from).getTime()
  const end = to ? new Date(to).getTime() : Date.now()
  return Math.round((end - start) / 1000)
}

// ─── Slug ───
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ─── Access code generator (3 letters + 3 numbers) ───
export function generateAccessCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // no I, O to avoid confusion
  const l1 = letters[Math.floor(Math.random() * letters.length)]
  const l2 = letters[Math.floor(Math.random() * letters.length)]
  const l3 = letters[Math.floor(Math.random() * letters.length)]
  const n1 = Math.floor(Math.random() * 10)
  const n2 = Math.floor(Math.random() * 10)
  const n3 = Math.floor(Math.random() * 10)
  return `${l1}${l2}${l3}${n1}${n2}${n3}`
}

// ─── QR Token generator ───
export function generateQRToken(): string {
  return crypto.randomUUID().split('-')[0]
}

// ─── Request types config ───
export const REQUEST_TYPES = {
  attention: { label: 'Solicitar Mesero', icon: 'Bell', color: 'text-amber-400', priority: 2 },
  bill: { label: 'Pedir la Cuenta', icon: 'Receipt', color: 'text-green-400', priority: 3 },
  menu: { label: 'Necesito el Menú', icon: 'BookOpen', color: 'text-blue-400', priority: 4 },
  complaint: { label: 'Tengo una Queja', icon: 'AlertTriangle', color: 'text-red-400', priority: 1 },
} as const

export const REQUEST_STATUS = {
  pending: { label: 'Pendiente', color: 'bg-yellow-500' },
  seen: { label: 'Visto', color: 'bg-blue-500' },
  in_progress: { label: 'En Camino', color: 'bg-indigo-500' },
  completed: { label: 'Atendido', color: 'bg-emerald-500' },
} as const

export const TABLE_STATUS = {
  available: { label: 'Disponible', color: 'bg-emerald-500' },
  occupied: { label: 'Ocupada', color: 'bg-yellow-500' },
  needs_attention: { label: 'Necesita Atención', color: 'bg-red-500' },
} as const

// ─── Master code ───
export const MASTER_CODE = '1122'
