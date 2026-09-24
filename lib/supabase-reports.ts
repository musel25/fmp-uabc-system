import { supabase } from "./supabase"
import { dbRowToEventReport, reportValuesToDbJson } from "./event-mapper"
import type { EventReport, ReportValues } from "./types"
export async function getEventReport(
  eventId: string,
): Promise<EventReport | null> {
  const { data, error } = await supabase
    .from("event_reports")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle()
  if (error) throw error
  return data ? dbRowToEventReport(data) : null
}
export async function saveEventReport(
  eventId: string,
  values: ReportValues,
  mode: "draft" | "submit",
  expectedVersion: number,
): Promise<EventReport> {
  const { data, error } = await supabase.rpc("save_event_report", {
    p_event_id: eventId,
    p_values: reportValuesToDbJson(values),
    p_mode: mode,
    p_expected_version: expectedVersion,
  })
  if (error)
    throw new Error(
      error.code === "40001"
        ? "El reporte cambió en otra sesión. Recarga antes de guardar."
        : error.message,
    )
  return dbRowToEventReport(data)
}

import { dbRowToEvent } from "./event-mapper"
import { getEventProgress } from "./supabase-progress"
import {
  filterReportRows,
  type ReportFilters,
  type ReportAnalyticsRow,
} from "./report-analytics"
export async function getReportAnalyticsRows(
  filters: ReportFilters = {},
): Promise<ReportAnalyticsRow[]> {
  const rows: ReportAnalyticsRow[] = []
  let cursor: string | undefined
  while (true) {
    let query = supabase.from("events").select("*").order("id").limit(200)
    if (cursor) query = query.gt("id", cursor)
    if (filters.eventId) query = query.eq("id", filters.eventId)
    if (filters.program) query = query.eq("program", filters.program)
    const { data, error } = await query
    if (error) throw error
    if (!data.length) break
    const events = data.map(dbRowToEvent),
      ids = events.map((e) => e.id)
    const [reports, progress] = await Promise.all([
      supabase.from("event_reports").select("*").in("event_id", ids),
      getEventProgress(ids),
    ])
    if (reports.error) throw reports.error
    if (ids.some((id) => progress[id]?.state !== "loaded"))
      throw new Error(
        "No se pudo consultar el seguimiento completo. Intenta de nuevo.",
      )
    const byId = new Map(
      (reports.data ?? []).map((r) => [r.event_id, dbRowToEventReport(r)]),
    )
    rows.push(
      ...events.map((event) => ({
        event,
        report: byId.get(event.id) ?? null,
        progress: progress[event.id],
      })),
    )
    cursor = events.at(-1)!.id
    if (data.length < 200) break
  }
  return filterReportRows(rows, filters)
}
