-- ============================================
-- Crear cuenta de Super Admin
-- ============================================
-- IMPORTANTE: Primero ejecute supabase-setup.sql
--
-- PASO 1: Crear el usuario en Supabase Auth
-- Vaya a Authentication > Users > Add User
-- Email: admin@meseroqr.app
-- Password: 1122
-- (O el email/password que prefiera)
--
-- PASO 2: Copie el UUID del usuario creado y reemplace 'USER_UUID_AQUI' abajo
--
-- PASO 3: Ejecute este SQL

INSERT INTO profiles (id, full_name, role, pin)
VALUES (
  'USER_UUID_AQUI',  -- Reemplazar con el UUID del usuario creado en Auth
  'Administrador General',
  'super_admin',
  '1122'
);
