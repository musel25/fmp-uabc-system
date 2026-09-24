BEGIN;
INSERT INTO private.attendance_integrations VALUES('test-form',repeat('s',32),true);
DO $$ DECLARE body text := '{"version":1,"action":"targets","sourceFormId":"test-form","afterEventId":null}'; ts bigint:=extract(epoch from now())::bigint; signature text; result jsonb; BEGIN
 BEGIN PERFORM public.attendance_sync(body,ts,repeat('0',64)); RAISE EXCEPTION 'bad signature accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 signature:=encode(extensions.hmac(convert_to(ts::text||'.'||body,'UTF8'),convert_to(repeat('s',32),'UTF8'),'sha256'),'hex');
 result:=public.attendance_sync(body,ts,signature);
 IF jsonb_typeof(result->'events')<>'array' THEN RAISE EXCEPTION 'targets failed'; END IF;
 BEGIN PERFORM public.attendance_sync(body,ts-1000,signature); RAISE EXCEPTION 'old signature accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
INSERT INTO auth.users(id,email) VALUES('00000000-0000-4000-8000-000000000031','test@example.test');
INSERT INTO public.events(id,name,phone,program,type,classification,modality,venue,start_date,end_date,has_cost,organizers,user_id) VALUES ('00000000-0000-4000-8000-000000000041','Sync','1','Médico','Académico','Taller','Presencial','test',now()+interval '30 days',now()+interval '31 days',false,'Test','00000000-0000-4000-8000-000000000031');
UPDATE public.events SET status='aprobado' WHERE id='00000000-0000-4000-8000-000000000041';
CREATE FUNCTION pg_temp.send_snapshot(body jsonb) RETURNS jsonb LANGUAGE sql AS $$
 SELECT public.attendance_sync(body::text,extract(epoch FROM now())::bigint,encode(extensions.hmac(convert_to((extract(epoch FROM now())::bigint)::text||'.'||body::text,'UTF8'),convert_to(repeat('s',32),'UTF8'),'sha256'),'hex'))
$$;
DO $$ DECLARE payload jsonb; result jsonb; before_time timestamptz; BEGIN
 SELECT jsonb_build_object('version',1,'action','snapshot','sourceFormId','test-form','eventId','00000000-0000-4000-8000-000000000041','snapshotStartedAt',now()-interval '30 seconds','responses',jsonb_agg(jsonb_build_object('sourceResponseId',n::text,'submittedAt',now()-interval '1 day','name','José','email',null,'category',null))) INTO payload FROM generate_series(1,1201) n;
 result:=pg_temp.send_snapshot(payload);
 IF (result->>'accepted')::int<>1201 OR (SELECT count(*) FROM public.attendance_responses)<>1201 THEN RAISE EXCEPTION 'Truncated snapshot'; END IF;
 SELECT last_synced_at INTO before_time FROM public.attendance_sync_state LIMIT 1;
 result:=pg_temp.send_snapshot(payload);
 IF result->>'duplicate'<>'true' OR (SELECT last_synced_at FROM public.attendance_sync_state LIMIT 1)<>before_time THEN RAISE EXCEPTION 'Non-idempotent retry'; END IF;
 BEGIN PERFORM pg_temp.send_snapshot(jsonb_set(payload,'{snapshotStartedAt}',to_jsonb(now()-interval '40 seconds'))); RAISE EXCEPTION 'old snapshot accepted'; EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
 payload:=jsonb_set(jsonb_set(payload,'{responses}','[]'),'{snapshotStartedAt}',to_jsonb(now()-interval '10 seconds'));
 PERFORM pg_temp.send_snapshot(payload);
 IF EXISTS(SELECT 1 FROM public.attendance_responses) OR (SELECT response_count FROM public.attendance_sync_state LIMIT 1)<>0 THEN RAISE EXCEPTION 'Deletion not reconciled'; END IF;
END $$;
ROLLBACK;
