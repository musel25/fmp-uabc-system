import { supabase } from "./supabase"
import { dbRowToEvent } from "./event-mapper"
import {
  sendAdminCodesNotification,
  sendEventApprovedNotification,
  sendEventRejectedNotification,
} from "./email"
import type { Event } from "./types"

/**
 * Admin-side event queries. These also run in the browser with the anon key;
 * RLS grants them across-the-board access only when the signed-in profile has
 * role "admin". The `profiles` embed resolves each event creator's current
 * name and email for the review UI.
 */

const EVENT_WITH_PROFILE = `
  *,
  profiles!events_user_id_fkey (
    name,
    email
  )
`

/** Review queue: pending events, oldest first. */
export async function getEventsForReview(): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_WITH_PROFILE)
    .eq("status", "en_revision")
    .order("created_at", { ascending: true })

  if (error) throw error
  return data.map(dbRowToEvent)
}

/** Paginated event listing with optional status/program/text filters. */
export async function getAllEvents(
  page = 1,
  limit = 20,
  filters?: {
    status?: string
    program?: string
    search?: string
  },
): Promise<{ events: Event[]; total: number; hasMore: boolean }> {
  let query = supabase.from("events").select(EVENT_WITH_PROFILE, { count: "exact" })

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status)
  }
  if (filters?.program && filters.program !== "all") {
    query = query.eq("program", filters.program)
  }
  if (filters?.search?.trim()) {
    query = query.or(
      `name.ilike.%${filters.search}%,responsible.ilike.%${filters.search}%,email.ilike.%${filters.search}%`,
    )
  }

  const from = (page - 1) * limit
  const { data, error, count } = await query
    .range(from, from + limit - 1)
    .order("created_at", { ascending: false })

  if (error) throw error

  const total = count ?? 0
  return {
    events: data.map(dbRowToEvent),
    total,
    hasMore: total > page * limit,
  }
}

/**
 * Resolves a review as approved, with an optional note for the organizer.
 * Notifies the organizer and the codes team by email (the helpers never
 * throw, so a mail failure can't undo the approval).
 */
export async function approveEvent(eventId: string, comments?: string): Promise<Event> {
  const event = await resolveReview(eventId, {
    status: "aprobado",
    admin_comments: comments?.trim() || null,
  })

  await sendEventApprovedNotification({
    eventName: event.name,
    userName: event.responsible || "Usuario",
    userEmail: event.email || "",
    eventId: event.id,
  })
  await sendAdminCodesNotification({
    eventName: event.name,
    eventId: event.id,
    codigosRequeridos: event.codigosRequeridos,
    startDate: event.startDate,
    endDate: event.endDate,
    venue: event.venue,
    type: event.type,
    classification: event.classification,
    classificationOther: event.classificationOther,
    programDetails: event.programDetails,
    userName: event.responsible || "Usuario",
    userEmail: event.email || "",
  })

  return event
}

/** Resolves a review as rejected; `reason` tells the organizer what to fix. */
export async function rejectEvent(
  eventId: string,
  reason: string,
  comments?: string,
): Promise<Event> {
  const event = await resolveReview(eventId, {
    status: "rechazado",
    rejection_reason: reason.trim(),
    admin_comments: comments?.trim() || null,
  })

  await sendEventRejectedNotification({
    eventName: event.name,
    userName: event.responsible || "Usuario",
    userEmail: event.email || "",
    eventId: event.id,
    rejectionReason: reason.trim(),
    adminComments: comments?.trim(),
  })

  return event
}

async function resolveReview(
  eventId: string,
  fields: Record<string, string | null>,
): Promise<Event> {
  const { data, error } = await supabase
    .from("events")
    .update(fields)
    .eq("id", eventId)
    .select(EVENT_WITH_PROFILE)
    .single()

  if (error) throw error
  return dbRowToEvent(data)
}
