import { supabase } from "./supabase"
import { dbRowToEvent, dbRowToReportFormArchive } from "./event-mapper"
import { REPORT_FORM_ID, type ReportFormData } from "./report-form-archive"
import type { Event } from "./types"

export async function getReportFormArchive() {
  const { data, error } = await supabase
    .from("report_form_archive")
    .select("*")
    .eq("source_form_id", REPORT_FORM_ID)
    .maybeSingle()
  if (error) throw error
  return data ? dbRowToReportFormArchive(data) : null
}

export async function saveReportFormArchive(
  data: ReportFormData,
  expectedVersion: number,
) {
  const result = await supabase.rpc("save_report_form_archive", {
    p_headers: data.headers,
    p_responses: data.responses,
    p_expected_version: expectedVersion,
  })
  if (result.error)
    throw new Error(
      result.error.code === "40001"
        ? "Otra sesión actualizó el archivo. Recarga antes de importar."
        : "No se pudo guardar el archivo. Los datos anteriores se conservan.",
    )
  return dbRowToReportFormArchive(result.data)
}

// Keyset pagination avoids the PostgREST row limit and does not depend on report rollout.
export async function getReportFormEvents(): Promise<Event[]> {
  const events: Event[] = []
  let cursor: string | undefined
  while (true) {
    let query = supabase.from("events").select("*").order("id").limit(200)
    if (cursor) query = query.gt("id", cursor)
    const { data, error } = await query
    if (error) throw error
    events.push(...data.map(dbRowToEvent))
    if (data.length < 200) return events
    cursor = data.at(-1)!.id
  }
}
