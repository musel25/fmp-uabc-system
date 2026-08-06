-- Migration 001 — applied 2026-08-06
--
-- 1. Adds real columns for the three answers introduced by the space-rental
--    update (previously folded into `observations` as labeled text lines).
-- 2. Cleans up the status model: the app never used 'borrador'; every insert
--    sets 'en_revision'.
-- 3. Hardens RLS:
--    - Users could UPDATE their own profile with no column restriction,
--      including `role` — i.e. anyone could make themselves admin.
--    - Users could INSERT/UPDATE their own events with any status,
--      including 'aprobado' — i.e. anyone could self-approve.
--    - Admins had no SELECT policy on profiles, so the reviewer-side
--      `events → profiles` join returned null for every other user.

BEGIN;

-- 1) New event columns ------------------------------------------------------
-- Nullable on purpose: rows created before this migration have no answer.
ALTER TABLE public.events
  ADD COLUMN is_authorized boolean,
  ADD COLUMN user_type text CHECK (user_type IN ('interno', 'externo')),
  ADD COLUMN seaes_categories text[] NOT NULL DEFAULT '{}';

-- 2) Status model -----------------------------------------------------------
ALTER TABLE public.events ALTER COLUMN status SET DEFAULT 'en_revision';
ALTER TABLE public.events DROP CONSTRAINT events_status_check;
ALTER TABLE public.events ADD CONSTRAINT events_status_check
  CHECK (status = ANY (ARRAY['en_revision', 'aprobado', 'rechazado']));

-- 3) is_admin() helper ------------------------------------------------------
-- SECURITY DEFINER so a policy on `profiles` can consult `profiles`
-- without infinite RLS recursion.
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- 4) Admins can read every profile (fixes the reviewer-side join) -----------
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- 5) Users cannot self-approve events ---------------------------------------
-- WITH CHECK pins every user-side write to 'en_revision'; only the admin
-- policies (role = 'admin') can produce 'aprobado' or 'rechazado' rows.
DROP POLICY "Users can create events" ON public.events;
CREATE POLICY "Users can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'en_revision');

DROP POLICY "Users can update their own events" ON public.events;
CREATE POLICY "Users can update their own events" ON public.events
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'en_revision');

-- 6) Users cannot edit their profile (esp. `role`) --------------------------
-- Profiles are created by the on_auth_user_created trigger and managed by
-- admins via the dashboard; the app has no profile-editing feature.
DROP POLICY "Users can update their own profile" ON public.profiles;

COMMIT;
