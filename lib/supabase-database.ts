import { supabase } from "./supabase"
import { createEventDataToDbRow, dbRowToEvent } from "./event-mapper"
import { sendNewEventNotification } from "./email"
import type { CreateEventData, Event } from "./types"

/**
 * User-facing event queries. Everything here runs in the browser with the
 * anon key and the visitor's session; Row Level Security limits each user to
 * their own rows and pins their writes to status "en_revision"
 * (see migrations/001_event_extras_and_rls_hardening.sql).
 */

/** Registers a new event; it enters the review queue immediately. */
export async function createEvent(eventData: CreateEventData, userId: string): Promise<Event> {
  const { data, error } = await supabase
    .from("events")
    .insert([{ ...createEventDataToDbRow(eventData), user_id: userId }])
    .select()
    .single()

  if (error) throw error
  const event = dbRowToEvent(data)

  // Aviso a la coordinación; nunca bloquea el registro (el helper no lanza).
  await sendNewEventNotification({
    eventName: event.name,
    userName: event.responsible || "Usuario",
    userEmail: event.email || "No disponible",
    eventId: event.id,
  })

  return event
}

/** Events registered by the given user, newest first. */
export async function getUserEvents(userId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data.map(dbRowToEvent)
}

/** A single event, or null when it doesn't exist / isn't visible to this user. */
export async function getEventById(eventId: string): Promise<Event | null> {
  const { data, error } = await supabase.from("events").select("*").eq("id", eventId).single()

  if (error) {
    if (error.code === "PGRST116") return null // no row
    throw error
  }
  return dbRowToEvent(data)
}

/**
 * Overwrites a rejected event with corrected data and returns it to the
 * review queue, in a single write (RLS requires the resulting row to be
 * "en_revision").
 */
export async function resubmitEvent(eventId: string, eventData: CreateEventData): Promise<Event> {
  const { data, error } = await supabase
    .from("events")
    .update(createEventDataToDbRow(eventData))
    .eq("id", eventId)
    .select()
    .single()

  if (error) throw error
  return dbRowToEvent(data)
}
