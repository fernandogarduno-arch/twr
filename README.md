# TWR OS v4 · The Wrist Room Operating System

## Setup en 3 pasos

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Supabase
Copia `.env.example` como `.env` y rellena tus credenciales:
```
VITE_SUPABASE_URL=https://tuproyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### 3. Correr localmente
```bash
npm run dev
```

## Deploy a Vercel (recomendado)
1. Sube esta carpeta a GitHub
2. Ve a vercel.com → Import Project
3. Agrega las variables de entorno (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY)
4. ¡Deploy!

## Deploy a Netlify
1. `npm run build`
2. Arrastra la carpeta `dist/` a netlify.com/drop

## Supabase SQL
Corre el archivo `supabase-setup.sql` en el SQL Editor de tu proyecto Supabase.
