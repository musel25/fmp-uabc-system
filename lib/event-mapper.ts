import type { CreateEventData, Event } from "./types"

/**
 * Single source of truth for converting between `events` table rows
 * (snake_case) and the `Event` domain type (camelCase). Used by both the
 * user-facing (lib/supabase-database.ts) and admin (lib/supabase-admin.ts)
 * data layers.
 */

/** Shape PostgREST returns; `profiles` is present only on admin queries that embed it. */
interface EventRow {
  [key: string]: unknown
  profiles?: { name?: string; email?: string } | null
}

export function dbRowToEvent(row: EventRow): Event {
  return {
    id: row.id as string,
    name: row.name as string,
    // Admin queries embed the creator's live profile; fall back to the copy
    // stored on the event itself.
    responsible: (row.profiles?.name ?? row.responsible ?? undefined) as string | undefined,
    email: (row.profiles?.email ?? row.email ?? undefined) as string | undefined,
    phone: row.phone as Event["phone"],
    program: row.program as Event["program"],
    type: row.type as Event["type"],
    classification: row.classification as Event["classification"],
    classificationOther: (row.classification_other ?? undefined) as string | undefined,
    modality: row.modality as Event["modality"],
    venue: (row.venue ?? "") as string,
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    hasCost: (row.has_cost ?? false) as boolean,
    onlineInfo: (row.online_info ?? undefined) as string | undefined,
    organizers: (row.organizers ?? "") as string,
    observations: (row.observations ?? undefined) as string | undefined,
    programDetails: (row.program_details ?? "") as string,
    speakerCvs: (row.speaker_cvs ?? "") as string,
    isAuthorized: (row.is_authorized ?? null) as Event["isAuthorized"],
    userType: (row.user_type ?? null) as Event["userType"],
    seaesCategories: (row.seaes_categories ?? []) as string[],
    status: row.status as Event["status"],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    userId: row.user_id as string,
    adminComments: (row.admin_comments ?? undefined) as string | undefined,
    rejectionReason: (row.rejection_reason ?? undefined) as string | undefined,
  }
}

/**
 * Row for inserting or resubmitting an event. Status is always
 * "en_revision" — RLS rejects any other value on user writes.
 */
export function createEventDataToDbRow(event: CreateEventData) {
  return {
    name: event.name,
    responsible: event.responsible || "",
    email: event.email || "",
    phone: event.phone,
    program: event.program,
    type: event.type,
    classification: event.classification,
    classification_other: event.classificationOther || null,
    modality: event.modality,
    venue: event.venue || "",
    start_date: event.startDate,
    end_date: event.endDate,
    has_cost: event.hasCost,
    online_info: event.onlineInfo || null,
    organizers: event.organizers,
    observations: event.observations || null,
    program_details: event.programDetails,
    speaker_cvs: event.speakerCvs,
    is_authorized: event.isAuthorized,
    user_type: event.userType,
    seaes_categories: event.seaesCategories,
    status: "en_revision" as const,
  }
}

import type { EventReport, ReportValues, AttendanceSummary, AttendanceResponse, PreparationValues, WorkflowSettings } from './types'
export function reportValuesToDbJson(v:ReportValues){return{email:v.email,teacher_count:v.teacherCount,student_count:v.studentCount,community_count:v.communityCount,teacher_mode:v.teacherMode,teachers:v.teachers,student_mode:v.studentMode,students:v.students,attendance_list_url:v.attendanceListUrl,photo_urls:v.photoUrls,narrative:v.narrative}}
export function dbRowToEventReport(r:EventRow):EventReport{return{
 eventId:r.event_id as string,eventName:r.event_name as string,email:r.email as string,
 teacherCount:r.teacher_count as number|null,studentCount:r.student_count as number|null,communityCount:r.community_count as number|null,
 teacherMode:r.teacher_mode as EventReport['teacherMode'],studentMode:r.student_mode as EventReport['studentMode'],teachers:r.teachers as EventReport['teachers'],students:r.students as EventReport['students'],
 attendanceListUrl:r.attendance_list_url as string,photoUrls:r.photo_urls as string[],narrative:r.narrative as string,
 status:r.status as EventReport['status'],version:r.version as number,firstSubmittedAt:r.first_submitted_at as string|null,submittedAt:r.submitted_at as string|null,updatedAt:r.updated_at as string,
 attendanceBasis:r.attendance_basis as EventReport['attendanceBasis'],verifiedResponseCount:r.verified_response_count as number|null,verifiedSnapshotAt:r.verified_snapshot_at as string|null,
}}
export function dbRowToAttendanceSummary(eventId:string,r:EventRow|null,enabled:boolean,now=new Date()):AttendanceSummary{
 const date=(r?.last_synced_at??null) as string|null
 const age=date?now.getTime()-new Date(date).getTime():NaN
 return{eventId,state:!enabled?'unconfigured':!r?'unverified':age>=0&&age<=3600000?'fresh':'stale',responseCount:r?r.response_count as number:null,lastSyncedAt:date}
}
export function dbRowToAttendanceResponse(r:EventRow):AttendanceResponse{return{eventId:r.event_id as string,sourceResponseId:r.source_response_id as string,submittedAt:r.submitted_at as string,name:r.name as string,email:r.email as string|null,category:r.category as AttendanceResponse['category']}}
export function dbRowToPreparation(r:EventRow|null):PreparationValues{return{reservationDone:r?.reservation_done===true,diffusionDone:r?.diffusion_done===true,qrShared:r?.qr_shared===true}}
export function dbRowToWorkflowSettings(r:EventRow):WorkflowSettings{return{reportsRolloutAt:r.reports_rollout_at as string|null,attendancePublishedUrl:r.attendance_published_url as string|null,attendancePrefillTemplate:r.attendance_prefill_template as string|null,attendanceEnabled:r.attendance_enabled===true}}

import type { EventProgress } from './types'
export function dbRowsToProgress(event:EventRow,report:EventRow|null,preparation:EventRow|null,sync:EventRow|null,settings:WorkflowSettings):EventProgress{
 const r=report?dbRowToEventReport(report):null
 return {state:'loaded',report:r,preparation:dbRowToPreparation(preparation),attendance:dbRowToAttendanceSummary(event.id as string,sync,settings.attendanceEnabled&&!!settings.attendancePrefillTemplate),tracking:!r&&(!settings.reportsRolloutAt||new Date(event.end_date as string)<new Date(settings.reportsRolloutAt))?'legacy':'current'}
}
