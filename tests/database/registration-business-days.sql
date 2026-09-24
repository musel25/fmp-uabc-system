BEGIN;
DO $$ BEGIN
 IF public.earliest_event_date('2026-09-21') <> '2026-09-28' OR public.earliest_event_date('2026-09-25') <> '2026-10-02' OR public.earliest_event_date('2026-09-26') <> '2026-10-02' OR public.earliest_event_date('2026-03-06') <> '2026-03-13' THEN RAISE EXCEPTION 'Business day boundary failed'; END IF;
END $$;
INSERT INTO auth.users(id,email) VALUES ('00000000-0000-4000-8000-000000000001','a@example.test');
DO $$ DECLARE event_id uuid; BEGIN
 BEGIN
 INSERT INTO public.events(name,phone,program,type,classification,modality,venue,start_date,end_date,has_cost,organizers,user_id) VALUES ('test','1','Médico','Académico','Taller','Presencial','test',now()+interval '1 day',now()+interval '2 days',false,'Test','00000000-0000-4000-8000-000000000001');
 RAISE EXCEPTION 'Accepted short lead';
 EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
 INSERT INTO public.events(name,phone,program,type,classification,modality,venue,start_date,end_date,has_cost,organizers,user_id) VALUES ('test','1','Médico','Académico','Taller','Presencial','test',now()+interval '30 days',now()+interval '31 days',false,'Test','00000000-0000-4000-8000-000000000001') RETURNING id INTO event_id;
 UPDATE public.events SET status='aprobado', start_date=now()-interval '1 day' WHERE id=event_id;
 UPDATE public.events SET status='rechazado' WHERE id=event_id;
 BEGIN
 UPDATE public.events SET status='en_revision' WHERE id=event_id;
 RAISE EXCEPTION 'Accepted short resubmission';
 EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
END $$;
ROLLBACK;
