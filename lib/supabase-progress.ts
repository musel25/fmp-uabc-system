import { supabase } from "./supabase"
import { dbRowToPreparation, dbRowToWorkflowSettings } from "./event-mapper"
import type { PreparationValues, WorkflowSettings } from "./types"
export async function getWorkflowSettings(): Promise<WorkflowSettings> {
  const { data, error } = await supabase.rpc("get_workflow_settings")
  if (error) throw error
  return dbRowToWorkflowSettings(data)
}
export async function saveEventPreparation(
  eventId: string,
  v: PreparationValues,
): Promise<PreparationValues> {
  const { data, error } = await supabase.rpc("save_event_preparation", {
    p_event_id: eventId,
    p_values: {
      reservation_done: v.reservationDone,
      diffusion_done: v.diffusionDone,
      qr_shared: v.qrShared,
    },
  })
  if (error) throw error
  return dbRowToPreparation(data)
}

import type { EventProgress } from "./types"
import { dbRowsToProgress } from "./event-mapper"
export async function getEventProgress(
  eventIds: string[],
): Promise<Record<string, EventProgress>> {
  const output: Record<string, EventProgress> = Object.fromEntries(
    eventIds.map((id) => [id, { state: "unavailable" }]),
  )
  try {
    const settings = await getWorkflowSettings()
    for (let start = 0; start < eventIds.length; start += 200) {
      const ids = eventIds.slice(start, start + 200)
      const results = await Promise.all([
        supabase.from("events").select("id,end_date").in("id", ids),
        ...["event_reports", "event_preparation", "attendance_sync_state"].map(
          (table) => supabase.from(table).select("*").in("event_id", ids),
        ),
      ])
      if (results.some((r) => r.error)) continue
      for (const e of results[0].data ?? [])
        output[e.id] = dbRowsToProgress(
          e,
          ...(results
            .slice(1)
            .map(
              (r) => (r.data ?? []).find((x) => x.event_id === e.id) ?? null,
            ) as [
            Record<string, unknown> | null,
            Record<string, unknown> | null,
            Record<string, unknown> | null,
          ]),
          settings,
        )
    }
  } catch {
    return output
  }
  return output
}
