-- Historical final-report CSV. This is separate from participant attendance.
CREATE TABLE public.report_form_archive (
  source_form_id text PRIMARY KEY CHECK (source_form_id='1wGwLI7a9HDV1Gsy446XWzH3wacKkYfJoSiBAYTeqXk4'),
  headers jsonb NOT NULL,
  responses jsonb NOT NULL,
  version integer NOT NULL CHECK (version>0),
  imported_at timestamptz NOT NULL DEFAULT now(),
  imported_by uuid NOT NULL REFERENCES public.profiles(id)
);
ALTER TABLE public.report_form_archive ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.report_form_archive FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.report_form_archive TO authenticated;
CREATE POLICY archive_admin_read ON public.report_form_archive FOR SELECT TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.save_report_form_archive(p_headers jsonb,p_responses jsonb,p_expected_version integer)
RETURNS public.report_form_archive LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
  result public.report_form_archive;
  item jsonb;
  source_id constant text := '1wGwLI7a9HDV1Gsy446XWzH3wacKkYfJoSiBAYTeqXk4';
BEGIN
  IF NOT coalesce(public.is_admin(),false) THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501'; END IF;
  IF coalesce(jsonb_typeof(p_headers),'')<>'array' OR coalesce(jsonb_typeof(p_responses),'')<>'array' THEN RAISE EXCEPTION 'Invalid CSV data' USING ERRCODE='22023'; END IF;
  IF jsonb_array_length(p_headers) NOT BETWEEN 1 AND 50 OR jsonb_array_length(p_responses) NOT BETWEEN 1 AND 5000 OR octet_length(p_headers::text)+octet_length(p_responses::text)>6000000 THEN RAISE EXCEPTION 'Invalid archive size' USING ERRCODE='22023'; END IF;
  IF EXISTS(SELECT FROM jsonb_array_elements(p_headers) x WHERE jsonb_typeof(x.value)<>'string') THEN RAISE EXCEPTION 'Invalid headers' USING ERRCODE='22023'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_responses) LOOP
    IF jsonb_typeof(item)<>'array' THEN RAISE EXCEPTION 'Invalid row' USING ERRCODE='22023'; END IF;
    IF jsonb_array_length(item)<>jsonb_array_length(p_headers) OR EXISTS(SELECT FROM jsonb_array_elements(item) x WHERE jsonb_typeof(x.value)<>'string') THEN RAISE EXCEPTION 'Invalid answers' USING ERRCODE='22023'; END IF;
  END LOOP;
  -- Serialize first import as well as replacements; reject stale browser tabs.
  PERFORM pg_catalog.pg_advisory_xact_lock(700007);
  SELECT * INTO result FROM public.report_form_archive WHERE source_form_id=source_id FOR UPDATE;
  IF p_expected_version IS DISTINCT FROM coalesce(result.version,0) THEN RAISE EXCEPTION 'Archive changed; reload before importing' USING ERRCODE='40001'; END IF;
  INSERT INTO public.report_form_archive(source_form_id,headers,responses,version,imported_at,imported_by)
  VALUES(source_id,p_headers,p_responses,coalesce(result.version,0)+1,clock_timestamp(),auth.uid())
  ON CONFLICT(source_form_id) DO UPDATE SET headers=EXCLUDED.headers,responses=EXCLUDED.responses,version=EXCLUDED.version,imported_at=EXCLUDED.imported_at,imported_by=EXCLUDED.imported_by
  RETURNING * INTO result;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.save_report_form_archive(jsonb,jsonb,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_report_form_archive(jsonb,jsonb,integer) TO authenticated;
