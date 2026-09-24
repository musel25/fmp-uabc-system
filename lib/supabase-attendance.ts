import { supabase } from "./supabase"
import {
  dbRowToAttendanceSummary,
  dbRowToAttendanceResponse,
} from "./event-mapper"
import { getWorkflowSettings } from "./supabase-progress"
import type { AttendanceSummary, AttendanceResponse } from "./types"
export async function getAttendanceSummary(
  eventId: string,
): Promise<AttendanceSummary> {
  const [settings, result] = await Promise.all([
    getWorkflowSettings(),
    supabase
      .from("attendance_sync_state")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle(),
  ])
  if (result.error) throw result.error
  return dbRowToAttendanceSummary(
    eventId,
    result.data,
    settings.attendanceEnabled && !!settings.attendancePrefillTemplate,
  )
}
export async function getAttendancePage(
  eventId: string,
  cursor?: string,
): Promise<{ responses: AttendanceResponse[]; nextCursor: string | null }> {
  let query = supabase
    .from("attendance_responses")
    .select("*")
    .eq("event_id", eventId)
    .order("source_response_id")
    .limit(201)
  if (cursor) query = query.gt("source_response_id", cursor)
  const { data, error } = await query
  if (error) throw error
  const rows = data.slice(0, 200).map(dbRowToAttendanceResponse)
  return {
    responses: rows,
    nextCursor: data.length > 200 ? rows.at(-1)!.sourceResponseId : null,
  }
}
export async function getAllAttendanceResponses(
  eventId: string,
): Promise<AttendanceResponse[]> {
  const result: AttendanceResponse[] = []
  let cursor: string | undefined
  do {
    const page = await getAttendancePage(eventId, cursor)
    result.push(...page.responses)
    cursor = page.nextCursor ?? undefined
  } while (cursor)
  return result
}
