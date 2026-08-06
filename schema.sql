-- Reference copy of the live database schema (Supabase / PostgreSQL).
-- Regenerated 2026-08-06 from the production project; incremental changes
-- live in migrations/. This file is documentation — apply migrations, don't
-- run this against an existing database.

-- ============================================================================
-- Tables
-- ============================================================================

-- One row per account, created automatically on signup (see handle_new_user).
-- `role` decides admin access and is managed only from the Supabase dashboard.
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- One row per registered event. See lib/types.ts for the field-by-field
-- meaning; columns map 1:1 to the `Event` interface (snake_case ↔ camelCase,
-- lib/event-mapper.ts).
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  responsible text,
  email text,
  phone text NOT NULL,
  program text NOT NULL CHECK (program IN ('Médico', 'Psicología', 'Nutrición', 'Posgrado', 'Otro')),
  type text NOT NULL CHECK (type IN ('Académico', 'Cultural', 'Deportivo', 'Salud')),
  classification text NOT NULL CHECK (classification IN ('Conferencia', 'Seminario', 'Taller', 'Otro')),
  classification_other text,
  modality text NOT NULL CHECK (modality IN ('Presencial', 'En línea', 'Mixta')),
  venue text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  has_cost boolean NOT NULL DEFAULT false,
  online_info text,
  organizers text NOT NULL,
  observations text,
  program_details text,
  speaker_cvs text,
  codigos_requeridos integer NOT NULL DEFAULT 0,
  -- Space-rental questions (migration 001). NULL = row predates the questions.
  is_authorized boolean,
  user_type text CHECK (user_type IN ('interno', 'externo')),
  seaes_categories text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'en_revision'
    CHECK (status IN ('en_revision', 'aprobado', 'rechazado')),
  -- Reserved for the certificate workflow; not yet used by the application.
  certificate_status text DEFAULT 'sin_solicitar'
    CHECK (certificate_status IN ('sin_solicitar', 'solicitadas', 'emitidas')),
  user_id uuid NOT NULL,
  admin_comments text,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- ============================================================================
-- Functions and triggers
-- ============================================================================

-- Creates the profile row for every new auth account.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'New User'), 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Keeps updated_at current on both tables.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- True when the signed-in user is an admin. SECURITY DEFINER so policies on
-- `profiles` can consult `profiles` without infinite RLS recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- ============================================================================
-- Row Level Security
-- ============================================================================
-- The app talks to the database from the browser with the anon key, so RLS is
-- the entire authorization model:
--   * users see and write only their own events;
--   * every user-side write must leave the event "en_revision" — only admins
--     can produce "aprobado"/"rechazado" rows;
--   * profiles are read-only for their owner (and readable by admins); nobody
--     can change `role` through the API.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can view their own events" ON public.events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'en_revision');

-- Owners can touch pending events (pre-review fixes) and rejected events
-- (the resubmit flow); approved events are immutable for them, and every
-- user-side write must leave the event "en_revision".
CREATE POLICY "Users can update their own events" ON public.events
  FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('en_revision', 'rechazado'))
  WITH CHECK (auth.uid() = user_id AND status = 'en_revision');

CREATE POLICY "Admins can view all events" ON public.events
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can update all events" ON public.events
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));
