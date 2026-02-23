-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  TWR OS v4 · SUPABASE SETUP (CORREGIDO)                         ║
-- ║  Corre esto en: supabase.com → SQL Editor → New Query           ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 0. LIMPIAR todo lo anterior
DROP TABLE IF EXISTS public.movimientos CASCADE;
DROP TABLE IF EXISTS public.inversionistas CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 1. TABLA DE PERFILES
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT,
  email       TEXT,
  role        TEXT NOT NULL DEFAULT 'pending',
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Permisos directos (sin RLS - herramienta interna)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.profiles TO anon, authenticated, service_role;

-- 3. Trigger: crea perfil automaticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 'pending')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. TABLA INVERSIONISTAS
CREATE TABLE public.inversionistas (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id       UUID REFERENCES public.profiles(id),
  name             TEXT NOT NULL,
  email            TEXT,
  capital_aportado NUMERIC DEFAULT 0,
  participacion    NUMERIC DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.movimientos (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inversionista_id UUID REFERENCES public.inversionistas(id) ON DELETE CASCADE,
  fecha            DATE NOT NULL,
  tipo             TEXT NOT NULL,
  monto            NUMERIC NOT NULL,
  concepto         TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.inversionistas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.inversionistas TO anon, authenticated, service_role;
GRANT ALL ON public.movimientos TO anon, authenticated, service_role;

-- 5. Reload schema cache
NOTIFY pgrst, 'reload schema';
