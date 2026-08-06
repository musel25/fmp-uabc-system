-- Migration 002 — applied 2026-08-06
--
-- Migration 001 pinned user-side writes to status 'en_revision', which stops
-- self-approval, but the UPDATE policy's USING clause still let an owner
-- modify an *approved* event (forcibly demoting it back to review). Approved
-- events should be immutable for their owner: only pending events (typo
-- fixes before review) and rejected events (the resubmit flow) are editable.

BEGIN;

DROP POLICY "Users can update their own events" ON public.events;
CREATE POLICY "Users can update their own events" ON public.events
  FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('en_revision', 'rechazado'))
  WITH CHECK (auth.uid() = user_id AND status = 'en_revision');

COMMIT;
