# MeseroQR - Sistema de Atención Inteligente

Sistema web premium para restaurantes. Los clientes escanean un QR para solicitar atención y el mesero recibe la alerta en tiempo real con sonido.

## Requisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com) (gratis)
- Cuenta en [Vercel](https://vercel.com) (gratis) para deploy

## Configuración

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto
2. En **SQL Editor**, ejecuta el archivo `supabase-setup.sql` completo
3. En **Authentication > Users**, crea un usuario:
   - Email: `admin@meseroqr.app`
   - Password: `1122`
4. Copia el UUID del usuario creado
5. En **SQL Editor**, ejecuta `supabase-create-admin.sql` reemplazando `USER_UUID_AQUI` con el UUID copiado

### 2. Configurar variables de entorno

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita `.env` con los valores de tu proyecto Supabase (Settings > API):

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Instalar y ejecutar

```bash
npm install
npm run dev
```

### 4. Usar el sistema

1. Inicia sesión como Super Admin: `admin@meseroqr.app` / `1122`
2. Crea un restaurante
3. Agrega un administrador al restaurante
4. Cierra sesión e inicia como admin del restaurante
5. Crea mesas (se generan QRs automáticamente)
6. Crea meseros
7. Asigna mesas a los meseros
8. Escanea un QR desde el celular para probar

## Deploy en Vercel

```bash
npm run build
```

1. Sube el proyecto a GitHub
2. Importa en Vercel
3. Agrega las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
4. Deploy

## Estructura de Roles

- **Super Admin (Dueño)**: Administra restaurantes y sus admins. PIN: 1122
- **Admin Restaurante**: Gestiona mesas, meseros, asignaciones, ve analíticas
- **Mesero**: Recibe alertas en tiempo real con sonido, atiende solicitudes

## Stack Tecnológico

- React + TypeScript + Vite
- Tailwind CSS v4 (tema oscuro premium)
- Supabase (Auth, Database, Realtime)
- Framer Motion (animaciones)
- Deployed en Vercel
