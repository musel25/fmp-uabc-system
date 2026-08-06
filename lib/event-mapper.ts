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
    codigosRequeridos: (row.codigos_requeridos ?? 0) as number,
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
    codigos_requeridos: event.codigosRequeridos,
    is_authorized: event.isAuthorized,
    user_type: event.userType,
    seaes_categories: event.seaesCategories,
    status: "en_revision" as const,
  }
}
