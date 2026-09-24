BEGIN;
INSERT INTO auth.users(id,email) VALUES ('00000000-0000-4000-8000-000000000011','owner@example.test'),('00000000-0000-4000-8000-000000000012','other@example.test');
INSERT INTO public.events(id,name,phone,program,type,classification,modality,venue,start_date,end_date,has_cost,organizers,user_id) VALUES ('00000000-0000-4000-8000-000000000021','Reseña','1','Médico','Académico','Taller','Presencial','test',now()+interval '30 days',now()+interval '31 days',false,'Test','00000000-0000-4000-8000-000000000011');
UPDATE public.events SET status='aprobado',start_date=now()-interval '2 days',end_date=now()-interval '1 day' WHERE id='00000000-0000-4000-8000-000000000021';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000011',true);
DO $$ DECLARE r public.event_reports; v jsonb := '{"email":"a@example.test","teacher_count":0,"student_count":2,"community_count":1,"teacher_mode":"none","student_mode":"none","teachers":[],"students":[],"narrative":"reseña","photo_urls":[],"attendance_list_url":""}'; BEGIN
 r := public.save_event_report('00000000-0000-4000-8000-000000000021',v,'draft',0);
 IF r.version<>1 OR r.status<>'draft' THEN RAISE EXCEPTION 'draft failed'; END IF;
 BEGIN PERFORM public.save_event_report(r.event_id,v,'submit',1); RAISE EXCEPTION 'exempted without evidence'; EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
 v:=jsonb_set(v,'{attendance_list_url}','"https://example.test/list"');
 r:=public.save_event_report(r.event_id,v,'submit',1);
 IF r.status<>'submitted' OR r.attendance_basis<>'list' OR r.narrative<>'RESEÑA' THEN RAISE EXCEPTION 'submission failed'; END IF;
 BEGIN PERFORM public.save_event_report(r.event_id,v,'submit',1); RAISE EXCEPTION 'stale version accepted'; EXCEPTION WHEN SQLSTATE '40001' THEN NULL; END;
 BEGIN PERFORM public.save_event_report(r.event_id,v,'draft',2); RAISE EXCEPTION 'submitted reverted'; EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
 BEGIN UPDATE public.event_reports SET attendance_basis='google'; RAISE EXCEPTION 'direct write accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM * FROM private.attendance_integrations; RAISE EXCEPTION 'private table readable'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 v:=jsonb_set(v,'{teacher_count}','-1');
 BEGIN PERFORM public.save_event_report(r.event_id,v,'submit',2); RAISE EXCEPTION 'negative count accepted'; EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
END $$;
RESET ROLE;
INSERT INTO private.attendance_integrations VALUES ('form-test',repeat('x',32),true);
INSERT INTO public.attendance_sync_state VALUES ('00000000-0000-4000-8000-000000000021','form-test',now(),now(),2,'test');
SET LOCAL ROLE authenticated;
DO $$ DECLARE r public.event_reports; v jsonb; original_time timestamptz; BEGIN
 SELECT * INTO r FROM public.event_reports LIMIT 1; original_time:=r.first_submitted_at;
 v:=jsonb_build_object('email',r.email,'teacher_count',0,'student_count',2,'community_count',0,'teacher_mode','none','student_mode','none','teachers','[]'::jsonb,'students','[]'::jsonb,'narrative','UNO'||chr(160)||'DOS','photo_urls','[]'::jsonb,'attendance_list_url','');
 r:=public.save_event_report(r.event_id,v,'submit',r.version);
 IF r.attendance_basis<>'google' OR r.verified_response_count<>2 OR r.first_submitted_at<>original_time OR r.narrative<>'UNO DOS' THEN RAISE EXCEPTION 'Google or correction decision failed'; END IF;
END $$;
RESET ROLE;
UPDATE public.attendance_sync_state SET last_synced_at=now()-interval '61 minutes';
SET LOCAL ROLE authenticated;
DO $$ DECLARE r public.event_reports; v jsonb; BEGIN
 SELECT * INTO r FROM public.event_reports LIMIT 1;
 v:=to_jsonb(r)-ARRAY['event_id','event_name','status','version','first_submitted_at','submitted_at','updated_at','attendance_basis','verified_response_count','verified_snapshot_at'];
 BEGIN PERFORM public.save_event_report(r.event_id,v,'submit',r.version); RAISE EXCEPTION 'stale snapshot waived'; EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000012',true);
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.event_reports) THEN RAISE EXCEPTION 'RLS leaked report'; END IF;
 BEGIN PERFORM public.save_event_report('00000000-0000-4000-8000-000000000021','{}','draft',0); RAISE EXCEPTION 'other owner write'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
UPDATE public.profiles SET role='admin' WHERE id='00000000-0000-4000-8000-000000000012';
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.event_reports) THEN RAISE EXCEPTION 'Admin cannot read report'; END IF;
 BEGIN PERFORM public.save_event_report('00000000-0000-4000-8000-000000000021','{}','draft',0); RAISE EXCEPTION 'Admin impersonated owner'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM public.save_event_report('00000000-0000-4000-8000-000000000021','{}','draft',0); RAISE EXCEPTION 'anon write'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
