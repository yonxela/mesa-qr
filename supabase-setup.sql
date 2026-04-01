-- ============================================
-- MeseroQR - Setup completo de Supabase
-- ============================================
-- Ejecutar este script en el SQL Editor de Supabase
-- Dashboard > SQL Editor > New Query > Pegar y ejecutar

-- 1. CREAR TABLAS
-- ============================================

CREATE TABLE IF NOT EXISTS restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  primary_color TEXT DEFAULT '#C6A961',
  created_at TIMESTAMPTZ DEFAULT now(),
  owner_id UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  number INT NOT NULL,
  label TEXT,
  qr_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'needs_attention')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'restaurant_admin', 'waiter')),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  pin TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS waiter_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  waiter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(waiter_id, table_id)
);

CREATE TABLE IF NOT EXISTS service_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'attention' CHECK (type IN ('attention', 'bill', 'menu', 'complaint')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'seen', 'in_progress', 'completed')),
  waiter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  seen_at TIMESTAMPTZ,
  attended_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. HABILITAR REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE service_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;

-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiter_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Profiles: usuarios autenticados pueden ver todos los perfiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (true);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (true);

-- Restaurants: lectura publica, escritura para autenticados
CREATE POLICY "restaurants_select" ON restaurants FOR SELECT USING (true);
CREATE POLICY "restaurants_insert" ON restaurants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "restaurants_update" ON restaurants FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "restaurants_delete" ON restaurants FOR DELETE USING (auth.role() = 'authenticated');

-- Tables: lectura publica (necesario para QR), escritura para autenticados
CREATE POLICY "tables_select" ON tables FOR SELECT USING (true);
CREATE POLICY "tables_insert" ON tables FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "tables_update" ON tables FOR UPDATE USING (true);
CREATE POLICY "tables_delete" ON tables FOR DELETE USING (auth.role() = 'authenticated');

-- Waiter assignments: solo autenticados
CREATE POLICY "waiter_assignments_select" ON waiter_assignments FOR SELECT USING (true);
CREATE POLICY "waiter_assignments_insert" ON waiter_assignments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "waiter_assignments_delete" ON waiter_assignments FOR DELETE USING (auth.role() = 'authenticated');

-- Service requests: lectura publica (para que el cliente vea su estado), insercion publica (cliente envia sin auth)
CREATE POLICY "service_requests_select" ON service_requests FOR SELECT USING (true);
CREATE POLICY "service_requests_insert" ON service_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "service_requests_update" ON service_requests FOR UPDATE USING (true);

-- Ratings: insercion publica (cliente califica sin auth), lectura para autenticados
CREATE POLICY "ratings_select" ON ratings FOR SELECT USING (true);
CREATE POLICY "ratings_insert" ON ratings FOR INSERT WITH CHECK (true);

-- 4. INDICES PARA RENDIMIENTO
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tables_qr_token ON tables(qr_token);
CREATE INDEX IF NOT EXISTS idx_profiles_restaurant ON profiles(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_service_requests_restaurant ON service_requests(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_table ON service_requests(table_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created ON service_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_waiter_assignments_waiter ON waiter_assignments(waiter_id);
CREATE INDEX IF NOT EXISTS idx_ratings_restaurant ON ratings(restaurant_id);
