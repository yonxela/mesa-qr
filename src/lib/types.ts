// ─── Roles ───
export type UserRole = 'super_admin' | 'restaurant_admin' | 'waiter'

// ─── Session (stored in sessionStorage) ───
export interface Session {
  role: UserRole
  restaurantId?: string
  restaurantName?: string
  waiterId?: string
  waiterName?: string
}

// ─── Restaurant ───
export interface Restaurant {
  id: string
  name: string
  slug: string
  logo_url: string | null
  address: string | null
  phone: string | null
  primary_color: string
  access_code: string // ABC123 format
  created_at: string
}

// ─── Table ───
export interface Table {
  id: string
  restaurant_id: string
  number: number
  label: string | null
  qr_token: string
  status: 'available' | 'occupied' | 'needs_attention'
  assigned_waiter_id: string | null
  created_at: string
}

// ─── Waiter ───
export interface Waiter {
  id: string
  restaurant_id: string
  name: string
  access_code: string // ABC123 format, auto-generated
  is_active: boolean
  created_at: string
}

// ─── Service Request ───
export type RequestType = 'attention' | 'bill' | 'menu' | 'complaint'
export type RequestStatus = 'pending' | 'seen' | 'in_progress' | 'completed'

export interface ServiceRequest {
  id: string
  restaurant_id: string
  table_id: string
  table_number: number
  type: RequestType
  status: RequestStatus
  waiter_id: string | null
  customer_note: string | null
  created_at: string
  seen_at: string | null
  attended_at: string | null
  completed_at: string | null
}

// ─── Rating ───
export interface Rating {
  id: string
  request_id: string
  restaurant_id: string
  table_id: string
  score: number
  comment: string | null
  created_at: string
}
