-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  TWR OS v4 · SUPABASE SETUP                                     ║
-- ║  Corre esto en: supabase.com → SQL Editor → New Query           ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1. TABLA DE PERFILES (extiende auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT,
  email       TEXT,
  role        TEXT NOT NULL DEFAULT 'pending',  -- director | operador | inversionista | pending
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trigger: crea perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', 'pending')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede ver su propio perfil
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Director puede ver TODOS los perfiles
CREATE POLICY "Director can read all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'director'
    )
  );

-- Director puede actualizar cualquier perfil (para asignar roles)
CREATE POLICY "Director can update profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'director'
    )
  );

-- Cualquier usuario autenticado puede insertar su propio perfil
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);


-- ════════════════════════════════════════════════════════════════════
-- 4. CREAR TU PRIMER USUARIO DIRECTOR
--    Después de crear tu cuenta en la app, corre esto con tu UUID:
--    (encuéntralo en Supabase → Authentication → Users)
-- ════════════════════════════════════════════════════════════════════
-- UPDATE public.profiles
-- SET role = 'director', active = true
-- WHERE email = 'tu@correo.com';


-- ════════════════════════════════════════════════════════════════════
-- 5. TABLA INVERSIONISTAS (para el portal de inversionistas)
--    Opcional: para cuando conectes a Supabase completamente
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.inversionistas (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id      UUID REFERENCES public.profiles(id),
  name            TEXT NOT NULL,
  email           TEXT,
  capital_aportado NUMERIC DEFAULT 0,
  participacion   NUMERIC DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.movimientos (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inversionista_id  UUID REFERENCES public.inversionistas(id) ON DELETE CASCADE,
  fecha             DATE NOT NULL,
  tipo              TEXT NOT NULL,  -- Aportación | Distribución | Retiro | Ajuste
  monto             NUMERIC NOT NULL,
  concepto          TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.inversionistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos ENABLE ROW LEVEL SECURITY;

-- Director ve todo
CREATE POLICY "Director full access inversionistas"
  ON public.inversionistas FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'director'));

CREATE POLICY "Director full access movimientos"
  ON public.movimientos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'director'));

-- Inversionista ve solo su cuenta
CREATE POLICY "Investor sees own account"
  ON public.inversionistas FOR SELECT
  USING (email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Investor sees own movements"
  ON public.movimientos FOR SELECT
  USING (
    inversionista_id IN (
      SELECT id FROM public.inversionistas
      WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    )
  );
