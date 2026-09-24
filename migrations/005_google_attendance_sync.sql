BEGIN;
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
COMMIT;
