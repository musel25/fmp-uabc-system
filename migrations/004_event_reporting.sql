BEGIN;
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
COMMIT;
