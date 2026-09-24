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
  -- Legado: el wizard ya no pregunta cuántos códigos requiere el evento;
  -- los organizadores los solicitan a actividades8-1.fmptij@uabc.edu.mx.
  -- La columna se conserva por los eventos históricos y su DEFAULT.
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

-- Migration 003: registration calendar
CREATE OR REPLACE FUNCTION public.earliest_event_date(p_today date)
RETURNS date LANGUAGE plpgsql IMMUTABLE SET search_path = '' AS $$
DECLARE cursor_day date := p_today; counted integer := 0;
BEGIN
 WHILE counted < 5 LOOP
  cursor_day := cursor_day + 1;
  IF extract(isodow FROM cursor_day) <= 5 THEN counted := counted + 1; END IF;
 END LOOP;
 RETURN cursor_day;
END $$;
CREATE OR REPLACE FUNCTION public.validate_registration_lead()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
 IF TG_OP = 'UPDATE' THEN
  IF NEW.status <> 'en_revision' OR (NEW.start_date IS NOT DISTINCT FROM OLD.start_date AND OLD.status <> 'rechazado') THEN RETURN NEW; END IF;
 END IF;
 IF (NEW.start_date AT TIME ZONE 'America/Tijuana')::date < public.earliest_event_date((now() AT TIME ZONE 'America/Tijuana')::date) THEN
  RAISE EXCEPTION 'Registra tu evento con al menos 5 días hábiles de anticipación (lunes a viernes).' USING ERRCODE='22023';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER events_registration_lead BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.validate_registration_lead();

-- Migration 004
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
CREATE TABLE private.attendance_integrations(source_form_id text PRIMARY KEY, signing_secret text NOT NULL CHECK(length(signing_secret)>=32), enabled boolean NOT NULL DEFAULT false);
CREATE UNIQUE INDEX one_active_attendance_source ON private.attendance_integrations(enabled) WHERE enabled;
REVOKE ALL ON private.attendance_integrations FROM PUBLIC,anon,authenticated;
CREATE TABLE public.workflow_settings(id boolean PRIMARY KEY DEFAULT true CHECK(id), reports_rollout_at timestamptz, attendance_published_url text, attendance_prefill_template text);
INSERT INTO public.workflow_settings(id) VALUES(true);
CREATE TABLE public.event_reports(
 event_id uuid PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
 event_name text NOT NULL, email text NOT NULL DEFAULT '',
 teacher_count integer, student_count integer, community_count integer,
 teacher_mode text CHECK(teacher_mode IN ('none','listed')), student_mode text CHECK(student_mode IN ('none','listed')),
 teachers jsonb NOT NULL DEFAULT '[]', students jsonb NOT NULL DEFAULT '[]',
 attendance_list_url text NOT NULL DEFAULT '', photo_urls jsonb NOT NULL DEFAULT '[]', narrative text NOT NULL DEFAULT '',
 status text NOT NULL CHECK(status IN ('draft','submitted')), version integer NOT NULL,
 first_submitted_at timestamptz, submitted_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now(),
 attendance_basis text CHECK(attendance_basis IN ('list','google')), verified_response_count integer, verified_snapshot_at timestamptz
);
CREATE TABLE public.event_preparation(event_id uuid PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE, reservation_done boolean NOT NULL DEFAULT false,diffusion_done boolean NOT NULL DEFAULT false,qr_shared boolean NOT NULL DEFAULT false);
CREATE TABLE public.attendance_responses(event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE, source_form_id text NOT NULL, source_response_id text NOT NULL, submitted_at timestamptz NOT NULL, name text NOT NULL, email text, category text CHECK(category IN ('docente','alumno','comunidad')), PRIMARY KEY(source_form_id,source_response_id));
CREATE INDEX attendance_event_idx ON public.attendance_responses(event_id,source_response_id);
CREATE TABLE public.attendance_sync_state(event_id uuid PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE, source_form_id text NOT NULL, snapshot_started_at timestamptz NOT NULL, last_synced_at timestamptz NOT NULL, response_count integer NOT NULL CHECK(response_count>=0), snapshot_hash text NOT NULL);
DO $$ DECLARE tab text; BEGIN
 FOREACH tab IN ARRAY ARRAY['event_reports','event_preparation','attendance_responses','attendance_sync_state'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',tab);
  EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated',tab);
  EXECUTE format('GRANT SELECT ON public.%I TO authenticated',tab);
  EXECUTE format('CREATE POLICY owner_admin_read ON public.%I FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id AND (e.user_id=auth.uid() OR public.is_admin())))',tab);
 END LOOP;
END $$;
ALTER TABLE public.workflow_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.workflow_settings FROM anon,authenticated;
GRANT SELECT,UPDATE ON public.workflow_settings TO authenticated;
CREATE POLICY settings_read ON public.workflow_settings FOR SELECT TO authenticated USING(true);
CREATE POLICY settings_admin ON public.workflow_settings FOR UPDATE TO authenticated USING(public.is_admin()) WITH CHECK(public.is_admin());
CREATE FUNCTION public.get_workflow_settings() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE insufficient_privilege; END IF;
 SELECT to_jsonb(s)||jsonb_build_object('attendance_enabled',EXISTS(SELECT 1 FROM private.attendance_integrations i WHERE i.enabled)) INTO result FROM public.workflow_settings s WHERE id;
 RETURN result;
END $$;
CREATE FUNCTION private.valid_https(value text) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT value IS NOT NULL AND length(value)<=2048 AND value ~ '^https://[^/@[:space:]]+([/:?#][^[:space:]]*)?$' AND value !~ '^https://[^/]*@'
$$;
CREATE FUNCTION public.save_event_report(p_event_id uuid,p_values jsonb,p_mode text,p_expected_version integer)
RETURNS public.event_reports LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE e public.events; r public.event_reports; old_version integer; s public.attendance_sync_state; k text; v jsonb; item jsonb; n text; m text; rows jsonb; basis text; wc integer;
BEGIN
 SELECT * INTO e FROM public.events WHERE id=p_event_id FOR UPDATE;
 IF e.id IS NULL OR auth.uid() IS NULL OR e.user_id<>auth.uid() THEN RAISE insufficient_privilege; END IF;
 IF e.status<>'aprobado' OR p_mode IS NULL OR p_mode NOT IN ('draft','submit') OR jsonb_typeof(p_values) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'El reporte requiere un evento aprobado y datos válidos.' USING ERRCODE='22023'; END IF;
 SELECT * INTO r FROM public.event_reports WHERE event_id=p_event_id FOR UPDATE;
 old_version:=coalesce(r.version,0);
 IF p_expected_version IS DISTINCT FROM old_version THEN RAISE EXCEPTION 'El reporte cambió en otra sesión. Recarga antes de guardar.' USING ERRCODE='40001'; END IF;
 IF r.status='submitted' AND p_mode='draft' THEN RAISE EXCEPTION 'Envía las correcciones completas del reporte recibido.' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_values) x WHERE x NOT IN ('email','teacher_count','student_count','community_count','teacher_mode','student_mode','teachers','students','attendance_list_url','photo_urls','narrative')) THEN RAISE EXCEPTION 'Campos de reporte no permitidos.' USING ERRCODE='22023'; END IF;
 FOR k IN SELECT unnest(ARRAY['email','attendance_list_url','narrative']) LOOP
  IF jsonb_typeof(p_values->k) IS DISTINCT FROM 'string' THEN RAISE EXCEPTION 'Texto inválido: %',k USING ERRCODE='22023'; END IF;
 END LOOP;
 r.email:=btrim(p_values->>'email'); r.attendance_list_url:=btrim(p_values->>'attendance_list_url');
 r.narrative:=upper(btrim(regexp_replace(p_values->>'narrative',U&'[\0009-\000D\0020\0085\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]+',' ','g')));
 wc:=CASE WHEN r.narrative='' THEN 0 ELSE cardinality(regexp_split_to_array(r.narrative,' +')) END;
 IF length(r.narrative)>50000 OR wc>250 OR length(r.email)>254 OR (r.email<>'' AND r.email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') OR (r.attendance_list_url<>'' AND NOT private.valid_https(r.attendance_list_url)) THEN RAISE EXCEPTION 'Revisa correo, enlace o reseña (máximo 250 palabras).' USING ERRCODE='22023'; END IF;
 FOR k IN SELECT unnest(ARRAY['teacher_count','student_count','community_count']) LOOP
  v:=p_values->k;
  IF v IS NULL OR (v<>'null'::jsonb AND (jsonb_typeof(v)<>'number' OR v::text !~ '^\d+$')) THEN RAISE EXCEPTION 'Indica cantidades enteras válidas.' USING ERRCODE='22023'; END IF;
  IF v<>'null'::jsonb AND (v::text)::numeric>1000000 THEN RAISE EXCEPTION 'Cantidad fuera de rango.' USING ERRCODE='22023'; END IF;
  IF p_mode='submit' AND v='null'::jsonb THEN RAISE EXCEPTION 'Completa las tres cantidades de asistentes.' USING ERRCODE='22023'; END IF;
 END LOOP;
 r.teacher_count:=(p_values->>'teacher_count')::integer; r.student_count:=(p_values->>'student_count')::integer; r.community_count:=(p_values->>'community_count')::integer;
 FOR k IN SELECT unnest(ARRAY['teacher','student']) LOOP
  m:=p_values->>(k||'_mode'); rows:=p_values->CASE WHEN k='teacher' THEN 'teachers' ELSE 'students' END;
  IF (m IS NOT NULL AND m NOT IN ('none','listed')) OR jsonb_typeof(rows) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Organizadores inválidos.' USING ERRCODE='22023'; END IF;
  IF jsonb_array_length(rows)>100 THEN RAISE EXCEPTION 'Máximo 100 organizadores por grupo.' USING ERRCODE='22023'; END IF;
  IF p_mode='submit' AND (m IS NULL OR (m='none' AND jsonb_array_length(rows)>0) OR (m='listed' AND jsonb_array_length(rows)=0)) THEN RAISE EXCEPTION 'Indica qué organizadores participaron.' USING ERRCODE='22023'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(rows) LOOP
   IF jsonb_typeof(item) IS DISTINCT FROM 'object' OR jsonb_typeof(item->'name') IS DISTINCT FROM 'string' OR length(item->>'name')>250 OR (p_mode='submit' AND btrim(item->>'name')='') THEN RAISE EXCEPTION 'Completa el nombre de cada organizador.' USING ERRCODE='22023'; END IF;
   IF k='teacher' AND (jsonb_typeof(item->'degree') IS DISTINCT FROM 'string' OR length(item->>'degree')>100 OR (p_mode='submit' AND btrim(item->>'degree')='')) THEN RAISE EXCEPTION 'Completa el grado docente.' USING ERRCODE='22023'; END IF;
   IF k='student' AND coalesce(item->>'level','') NOT IN ('licenciatura','maestria','otro_posgrado') THEN RAISE EXCEPTION 'Nivel de estudiante inválido.' USING ERRCODE='22023'; END IF;
  END LOOP;
 END LOOP;
 r.teacher_mode:=p_values->>'teacher_mode'; r.student_mode:=p_values->>'student_mode'; r.teachers:=p_values->'teachers'; r.students:=p_values->'students'; r.photo_urls:=p_values->'photo_urls';
 IF jsonb_typeof(r.photo_urls) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Enlaces de fotografías inválidos.' USING ERRCODE='22023'; END IF;
 IF jsonb_array_length(r.photo_urls)>10 THEN RAISE EXCEPTION 'Máximo 10 enlaces de fotografías.' USING ERRCODE='22023'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(r.photo_urls) LOOP
  IF jsonb_typeof(item)<>'string' OR NOT private.valid_https(item#>>'{}') THEN RAISE EXCEPTION 'Usa enlaces HTTPS de fotografías.' USING ERRCODE='22023'; END IF;
 END LOOP;
 IF p_mode='submit' THEN
  IF e.end_date>now() OR r.email='' OR wc=0 THEN RAISE EXCEPTION 'El evento debe haber terminado; completa correo y reseña.' USING ERRCODE='22023'; END IF;
  IF r.attendance_list_url<>'' THEN basis:='list';
  ELSE
   SELECT * INTO s FROM public.attendance_sync_state a WHERE a.event_id=p_event_id FOR SHARE;
   IF s.event_id IS NULL OR s.response_count<1 OR s.last_synced_at<now()-interval '60 minutes' OR s.last_synced_at>now() OR NOT EXISTS(SELECT 1 FROM private.attendance_integrations i WHERE i.source_form_id=s.source_form_id AND i.enabled) THEN RAISE EXCEPTION 'Adjunta el enlace de la lista: la asistencia electrónica no está verificada.' USING ERRCODE='22023'; END IF;
   basis:='google';
  END IF;
 END IF;
 r.event_id:=p_event_id; r.event_name:=upper(e.name); r.status:=CASE WHEN p_mode='submit' THEN 'submitted' ELSE 'draft' END; r.version:=old_version+1; r.updated_at:=now();
 IF p_mode='submit' THEN r.first_submitted_at:=coalesce(r.first_submitted_at,now());r.submitted_at:=now(); END IF;
 r.attendance_basis:=basis; r.verified_response_count:=CASE WHEN basis='google' THEN s.response_count END; r.verified_snapshot_at:=CASE WHEN basis='google' THEN s.last_synced_at END;
 -- The event row lock serializes first creation and subsequent edits.
 DELETE FROM public.event_reports WHERE event_id=p_event_id;
 INSERT INTO public.event_reports SELECT r.*;
 RETURN r;
END $$;
CREATE FUNCTION public.save_event_preparation(p_event_id uuid,p_values jsonb) RETURNS public.event_preparation LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.event_preparation; k text;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.events WHERE id=p_event_id AND user_id=auth.uid() AND status='aprobado') THEN RAISE insufficient_privilege; END IF;
 IF jsonb_typeof(p_values) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Preparación inválida' USING ERRCODE='22023'; END IF;
 FOR k IN SELECT unnest(ARRAY['reservation_done','diffusion_done','qr_shared']) LOOP
  IF jsonb_typeof(p_values->k) IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Confirmación inválida' USING ERRCODE='22023'; END IF;
 END LOOP;
 INSERT INTO public.event_preparation VALUES(p_event_id,(p_values->>'reservation_done')::boolean,(p_values->>'diffusion_done')::boolean,(p_values->>'qr_shared')::boolean)
 ON CONFLICT(event_id) DO UPDATE SET reservation_done=EXCLUDED.reservation_done,diffusion_done=EXCLUDED.diffusion_done,qr_shared=EXCLUDED.qr_shared RETURNING * INTO r;
 RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.save_event_report(uuid,jsonb,text,integer), public.save_event_preparation(uuid,jsonb),public.get_workflow_settings() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_event_report(uuid,jsonb,text,integer), public.save_event_preparation(uuid,jsonb),public.get_workflow_settings() TO authenticated;

-- Migration 005
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE TABLE private.attendance_response_versions(source_form_id text NOT NULL,source_response_id text NOT NULL,snapshot_started_at timestamptz NOT NULL,event_id uuid,PRIMARY KEY(source_form_id,source_response_id));
REVOKE ALL ON private.attendance_response_versions FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.attendance_sync(p_body text,p_sent_at bigint,p_signature text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE payload jsonb; secret text; source_id text; expected text; action text; eid uuid; started timestamptz; old public.attendance_sync_state; hash text; rows jsonb; item jsonb; result jsonb; after_id uuid; last_id uuid; ids uuid[]; affected uuid[]; count_rows integer;
BEGIN
 IF p_body IS NULL OR octet_length(p_body)>2097152 OR p_sent_at IS NULL OR abs(extract(epoch from clock_timestamp())-p_sent_at)>300 OR p_signature IS NULL THEN RAISE insufficient_privilege; END IF;
 payload:=p_body::jsonb; source_id:=payload->>'sourceFormId';
 SELECT signing_secret INTO secret FROM private.attendance_integrations WHERE source_form_id=source_id AND enabled;
 IF secret IS NULL THEN RAISE insufficient_privilege; END IF;
 expected:=encode(extensions.hmac(convert_to(p_sent_at::text||'.'||p_body,'UTF8'),convert_to(secret,'UTF8'),'sha256'),'hex');
 IF expected<>p_signature THEN RAISE insufficient_privilege; END IF;
 IF payload->>'version' IS DISTINCT FROM '1' THEN RAISE EXCEPTION 'Unsupported version' USING ERRCODE='22023'; END IF;
 action:=payload->>'action';
 IF action='targets' THEN
  after_id:=nullif(payload->>'afterEventId','')::uuid;
  SELECT array_agg(id ORDER BY id) INTO ids FROM (SELECT id FROM public.events WHERE status='aprobado' AND (after_id IS NULL OR id>after_id) ORDER BY id LIMIT 501) q;
  SELECT coalesce(jsonb_agg(jsonb_build_object('eventId',x) ORDER BY x),'[]') INTO result FROM unnest(ids[1:500]) x;
  RETURN jsonb_build_object('events',result,'nextCursor',CASE WHEN cardinality(ids)>500 THEN ids[500] END);
 END IF;
 IF action IS DISTINCT FROM 'snapshot' THEN RAISE EXCEPTION 'Invalid action' USING ERRCODE='22023'; END IF;
 eid:=(payload->>'eventId')::uuid;started:=(payload->>'snapshotStartedAt')::timestamptz;rows:=payload->'responses';
 IF eid IS NULL OR started IS NULL OR started>clock_timestamp()+interval '30 seconds' OR started<clock_timestamp()-interval '60 minutes' OR jsonb_typeof(rows) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid snapshot' USING ERRCODE='22023'; END IF;
 IF jsonb_array_length(rows)>5000 OR NOT EXISTS(SELECT 1 FROM public.events WHERE id=eid AND status='aprobado') THEN RAISE EXCEPTION 'Invalid event or excessive snapshot' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(source_id,0));
 SELECT * INTO old FROM public.attendance_sync_state WHERE event_id=eid FOR UPDATE;
 hash:=encode(extensions.digest(convert_to(p_body,'UTF8'),'sha256'),'hex');
 IF old.source_form_id=source_id AND old.snapshot_started_at>=started THEN
  IF old.snapshot_started_at=started AND old.snapshot_hash=hash THEN RETURN jsonb_build_object('accepted',old.response_count,'duplicate',true); END IF;
  RAISE EXCEPTION 'Outdated snapshot' USING ERRCODE='22023';
 END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(rows) x GROUP BY x->>'sourceResponseId' HAVING count(*)>1) THEN RAISE EXCEPTION 'Duplicate response ID' USING ERRCODE='22023'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(rows) LOOP
  IF jsonb_typeof(item) IS DISTINCT FROM 'object' OR jsonb_typeof(item->'sourceResponseId') IS DISTINCT FROM 'string' OR length(item->>'sourceResponseId') NOT BETWEEN 1 AND 300 OR jsonb_typeof(item->'name') IS DISTINCT FROM 'string' OR length(btrim(item->>'name')) NOT BETWEEN 1 AND 250 OR jsonb_typeof(item->'submittedAt') IS DISTINCT FROM 'string' OR (item->>'submittedAt')::timestamptz>clock_timestamp()+interval '30 seconds' OR (item->>'submittedAt')::timestamptz IS NULL THEN RAISE EXCEPTION 'Invalid response fields' USING ERRCODE='22023'; END IF;
  IF (item->>'email' IS NOT NULL AND (jsonb_typeof(item->'email')<>'string' OR length(item->>'email')>254)) OR (item->>'category' IS NOT NULL AND item->>'category' NOT IN ('docente','alumno','comunidad')) THEN RAISE EXCEPTION 'Invalid optional fields' USING ERRCODE='22023'; END IF;
  IF EXISTS(SELECT 1 FROM private.attendance_response_versions v WHERE v.source_form_id=source_id AND v.source_response_id=item->>'sourceResponseId' AND v.snapshot_started_at>started) THEN RAISE EXCEPTION 'Outdated response version' USING ERRCODE='22023'; END IF;
 END LOOP;
 SELECT array_agg(DISTINCT event_id) INTO affected FROM public.attendance_responses a WHERE a.source_form_id=source_id AND a.source_response_id IN(SELECT x->>'sourceResponseId' FROM jsonb_array_elements(rows) x);
 INSERT INTO private.attendance_response_versions SELECT a.source_form_id,a.source_response_id,started,NULL FROM public.attendance_responses a WHERE a.event_id=eid AND a.source_form_id=source_id AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(rows) x WHERE x->>'sourceResponseId'=a.source_response_id)
 ON CONFLICT(source_form_id,source_response_id) DO UPDATE SET snapshot_started_at=EXCLUDED.snapshot_started_at,event_id=NULL;
 DELETE FROM public.attendance_responses WHERE event_id=eid;
 FOR item IN SELECT value FROM jsonb_array_elements(rows) LOOP
  INSERT INTO public.attendance_responses VALUES(eid,source_id,item->>'sourceResponseId',(item->>'submittedAt')::timestamptz,btrim(item->>'name'),nullif(btrim(item->>'email'),''),item->>'category')
  ON CONFLICT(source_form_id,source_response_id) DO UPDATE SET event_id=EXCLUDED.event_id,submitted_at=EXCLUDED.submitted_at,name=EXCLUDED.name,email=EXCLUDED.email,category=EXCLUDED.category;
  INSERT INTO private.attendance_response_versions VALUES(source_id,item->>'sourceResponseId',started,eid)
  ON CONFLICT(source_form_id,source_response_id) DO UPDATE SET snapshot_started_at=EXCLUDED.snapshot_started_at,event_id=EXCLUDED.event_id;
 END LOOP;
 count_rows:=jsonb_array_length(rows);
 INSERT INTO public.attendance_sync_state VALUES(eid,source_id,started,clock_timestamp(),count_rows,hash)
 ON CONFLICT(event_id) DO UPDATE SET source_form_id=EXCLUDED.source_form_id,snapshot_started_at=EXCLUDED.snapshot_started_at,last_synced_at=EXCLUDED.last_synced_at,response_count=EXCLUDED.response_count,snapshot_hash=EXCLUDED.snapshot_hash;
 UPDATE public.attendance_sync_state s SET response_count=(SELECT count(*) FROM public.attendance_responses a WHERE a.event_id=s.event_id) WHERE s.event_id=ANY(affected) AND s.event_id<>eid;
 RETURN jsonb_build_object('accepted',count_rows,'duplicate',false);
END $$;
REVOKE ALL ON FUNCTION public.attendance_sync(text,bigint,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attendance_sync(text,bigint,text) TO anon,authenticated;
