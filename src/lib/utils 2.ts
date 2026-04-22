import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export const REQUEST_TYPES = {
  attention: { label: 'Solicitar Mesero', icon: 'Bell', color: 'text-gold-400', priority: 2 },
  bill: { label: 'Pedir la Cuenta', icon: 'Receipt', color: 'text-green-400', priority: 3 },
  menu: { label: 'Necesito el Menú', icon: 'BookOpen', color: 'text-blue-400', priority: 4 },
  complaint: { label: 'Tengo una Queja', icon: 'AlertTriangle', color: 'text-red-400', priority: 1 },
} as const

export type RequestType = keyof typeof REQUEST_TYPES

export const REQUEST_STATUS = {
  pending: { label: 'Pendiente', color: 'bg-warning' },
  seen: { label: 'Visto', color: 'bg-info' },
  in_progress: { label: 'En Camino', color: 'bg-blue-500' },
  completed: { label: 'Atendido', color: 'bg-success' },
} as const

export const TABLE_STATUS = {
  available: { label: 'Disponible', color: 'bg-success' },
  occupied: { label: 'Ocupada', color: 'bg-warning' },
  needs_attention: { label: 'Necesita Atención', color: 'bg-danger' },
} as const
