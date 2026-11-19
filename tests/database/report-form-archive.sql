BEGIN;
INSERT INTO auth.users(id,email) VALUES ('00000000-0000-4000-8000-000000000071','archive-admin@example.test'),('00000000-0000-4000-8000-000000000072','archive-user@example.test');
UPDATE public.profiles SET role='admin' WHERE id='00000000-0000-4000-8000-000000000071';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000071',true);
DO $$ DECLARE r public.report_form_archive; BEGIN
 r:=public.save_report_form_archive('["Pregunta"]','[["Respuesta"]]',0);
 IF r.version<>1 THEN RAISE EXCEPTION 'Import failed'; END IF;
 r:=public.save_report_form_archive('["Pregunta"]','[["Actualizada"]]',1);
 IF r.version<>2 OR jsonb_array_length(r.responses)<>1 THEN RAISE EXCEPTION 'Replacement failed'; END IF;
 BEGIN PERFORM public.save_report_form_archive('["Pregunta"]','[["Obsoleta"]]',1); RAISE EXCEPTION 'Stale replacement allowed'; EXCEPTION WHEN SQLSTATE '40001' THEN NULL; END;
 BEGIN PERFORM public.save_report_form_archive('["Pregunta"]','[[1]]',2); RAISE EXCEPTION 'Nontext answer allowed'; EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
 BEGIN PERFORM public.save_report_form_archive('["Pregunta"]','[["a","b"]]',2); RAISE EXCEPTION 'Invalid row allowed'; EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
 BEGIN PERFORM public.save_report_form_archive('["Pregunta"]','[]',2); RAISE EXCEPTION 'Empty archive allowed'; EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
 BEGIN DELETE FROM public.report_form_archive; RAISE EXCEPTION 'Direct deletion allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 IF (SELECT responses->0->>0 FROM public.report_form_archive)<>'Actualizada' THEN RAISE EXCEPTION 'Failed import changed data'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000072',true);
DO $$ BEGIN
 IF EXISTS(SELECT FROM public.report_form_archive) THEN RAISE EXCEPTION 'Archive leaked to user'; END IF;
 BEGIN PERFORM public.save_report_form_archive('["Pregunta"]','[["Intruso"]]',2); RAISE EXCEPTION 'User imported'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM * FROM public.report_form_archive; RAISE EXCEPTION 'Archive leaked to anonymous'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.save_report_form_archive('["Pregunta"]','[["Intruso"]]',2); RAISE EXCEPTION 'Anonymous imported'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
