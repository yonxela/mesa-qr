export type UserRole = 'super_admin' | 'restaurant_admin' | 'waiter'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  restaurant_id: string | null
  pin: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
}

export interface Restaurant {
  id: string
  name: string
  slug: string
  logo_url: string | null
  address: string | null
  phone: string | null
  primary_color: string
  created_at: string
  owner_id: string
}

export interface Table {
  id: string
  restaurant_id: string
  number: number
  label: string | null
  qr_token: string
  status: 'available' | 'occupied' | 'needs_attention'
  created_at: string
}

export interface WaiterAssignment {
  id: string
  waiter_id: string
  table_id: string
  created_at: string
}

export interface ServiceRequest {
  id: string
  table_id: string
  restaurant_id: string
  type: 'attention' | 'bill' | 'menu' | 'complaint'
  status: 'pending' | 'seen' | 'in_progress' | 'completed'
  waiter_id: string | null
  customer_note: string | null
  created_at: string
  seen_at: string | null
  attended_at: string | null
  completed_at: string | null
}

export interface Rating {
  id: string
  service_request_id: string
  table_id: string
  restaurant_id: string
  score: number
  comment: string | null
  created_at: string
}

export interface ServiceRequestWithTable extends ServiceRequest {
  table?: Table
  waiter?: Profile
}
