BEGIN;
CREATE OR REPLACE FUNCTION public.earliest_event_date(p_today date)
RETURNS date LANGUAGE plpgsql IMMUTABLE STRICT SET search_path = '' AS $$
DECLARE cursor_day date := p_today; counted integer := 0;
BEGIN
 IF NOT isfinite(p_today) THEN RAISE EXCEPTION 'Invalid registration date' USING ERRCODE='22023'; END IF;
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
COMMIT;
