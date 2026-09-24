/**
 * Domain types for the FMP-UABC event registration system.
 *
 * An `Event` is a request to hold an activity at the Faculty of Medicine and
 * Psychology (FMP). A user registers the event, the coordination reviews it,
 * and it comes back either approved or rejected with corrections. Rejected
 * events can be edited and resubmitted.
 */

/**
 * Review lifecycle. Every event is created as "en_revision"; only admins can
 * move it to "aprobado" or "rechazado" (enforced by RLS — see
 * migrations/001_event_extras_and_rls_hardening.sql).
 */
export type EventStatus = "en_revision" | "aprobado" | "rechazado"

/** Academic program the event belongs to. */
export type EventProgram = "Médico" | "Psicología" | "Nutrición" | "Posgrado" | "Otro"

/** General nature of the activity. */
export type EventType = "Académico" | "Cultural" | "Deportivo" | "Salud"

/** Format of the activity; "Otro" requires `classificationOther`. */
export type EventClassification = "Conferencia" | "Seminario" | "Taller" | "Otro"

export type EventModality = "Presencial" | "En línea" | "Mixta"

/**
 * Whether the person registering belongs to UABC. External users rent the
 * faculty's spaces and pay a fee (see EXTERNAL_USER_COSTS in lib/event-form.ts).
 */
export type UserType = "interno" | "externo"

/** An event as stored in the `events` table (camelCase mirror of the row). */
export interface Event {
  id: string
  name: string
  /** Copied from the creator's profile at registration time. */
  responsible?: string
  /** Copied from the creator's profile at registration time. */
  email?: string
  phone: string
  program: EventProgram
  type: EventType
  classification: EventClassification
  classificationOther?: string
  modality: EventModality
  /** Physical location; empty for online-only events. */
  venue: string
  /** ISO-8601 UTC. Captured in America/Tijuana local time (see lib/timezone.ts). */
  startDate: string
  /** ISO-8601 UTC. */
  endDate: string
  /** Events that charge attendees are handled outside this system. */
  hasCost: boolean
  /** Platform/link details for online or mixed events. */
  onlineInfo?: string
  /** Names as they must appear on certificates, separated by semicolons. */
  organizers: string
  observations?: string
  /** Schedule, topics and speakers (long text). */
  programDetails: string
  /** Speakers' curricular summaries (long text). */
  speakerCvs: string
  /**
   * Whether dirección/subdirección had already authorized the event when it
   * was registered. `null` on rows created before this question existed.
   */
  isAuthorized: boolean | null
  /** `null` on rows created before this question existed. */
  userType: UserType | null
  /** SEAES framework categories the event falls under (0 or more). */
  seaesCategories: string[]
  status: EventStatus
  createdAt: string
  updatedAt: string
  userId: string
  /** Optional admin note attached when resolving the review. */
  adminComments?: string
  /** Required when status is "rechazado": what the organizer must fix. */
  rejectionReason?: string
}

/** Payload for creating or resubmitting an event (everything the wizard collects). */
export type CreateEventData = Omit<
  Event,
  | "id"
  | "status"
  | "createdAt"
  | "updatedAt"
  | "userId"
  | "adminComments"
  | "rejectionReason"
  | "isAuthorized"
  | "userType"
> & {
  /** Required at creation — the wizard forces an answer. */
  isAuthorized: boolean
  userType: UserType
}

export type ReportStatus = "draft" | "submitted"
export type ParticipationMode = "none" | "listed" | null
export type AttendeeCategory = "docente" | "alumno" | "comunidad" | null
export interface TeacherOrganizer { name: string; degree: string }
export interface StudentOrganizer {
  name: string
  level: "licenciatura" | "maestria" | "otro_posgrado"
}
export interface ReportValues {
  email: string
  teacherCount: number | null
  studentCount: number | null
  communityCount: number | null
  teacherMode: ParticipationMode
  teachers: TeacherOrganizer[]
  studentMode: ParticipationMode
  students: StudentOrganizer[]
  attendanceListUrl: string
  photoUrls: string[]
  narrative: string
}
export interface EventReport extends ReportValues {
  eventId: string
  eventName: string
  status: ReportStatus
  version: number
  firstSubmittedAt: string | null
  submittedAt: string | null
  updatedAt: string
  attendanceBasis: "list" | "google" | null
  verifiedResponseCount: number | null
  verifiedSnapshotAt: string | null
}
export interface AttendanceSummary {
  eventId: string
  state: "unconfigured" | "unverified" | "fresh" | "stale"
  responseCount: number | null
  lastSyncedAt: string | null
}
export interface AttendanceResponse {
  eventId: string
  sourceResponseId: string
  submittedAt: string
  name: string
  email: string | null
  category: AttendeeCategory
}
export interface PreparationValues {
  reservationDone: boolean
  diffusionDone: boolean
  qrShared: boolean
}
export interface WorkflowSettings {
  reportsRolloutAt: string | null
  attendancePublishedUrl: string | null
  attendancePrefillTemplate: string | null
  attendanceEnabled: boolean
}
export type EventProgress =
  | { state: "unavailable" }
  | {
      state: "loaded"
      report: Pick<EventReport, "status" | "version" | "submittedAt" | "firstSubmittedAt" | "attendanceBasis"> | null
      preparation: PreparationValues
      attendance: AttendanceSummary
      tracking: "current" | "legacy"
    }
