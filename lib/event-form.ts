import type { CreateEventData, Event, UserType } from "./types"
import { utcToTijuanaLocal } from "./timezone"

/**
 * Catalog data and form-value types for the event registration wizard
 * (components/events/event-wizard.tsx).
 */

/** Categories of UABC's SEAES framework an event can fall under. */
export const SEAES_CATEGORIES = [
  "Compromiso con la Responsabilidad Social",
  "Equidad Social y de género",
  "Inclusión",
  "Innovación Social",
  "Interculturalidad",
  "Vanguardia",
  "Formación integral",
  "Excelencia",
  "Mejora continua",
  "Desarrollo de competencias profesionales",
  "Pensamiento crítico",
  "La práctica basada en la evidencia",
] as const

/** Space rental fees shown to users external to UABC. */
export const EXTERNAL_USER_COSTS = [
  { space: "Aula Magna", cost: "$2,500" },
  { space: "Audiovisual", cost: "$2,500" },
  { space: "Sala de Desarrollo Humano", cost: "$1,500" },
  { space: "Salón (201–208) del Edif. 1A", cost: "$1,500" },
] as const

/** Steps an external user follows once their event is authorized. */
export const EXTERNAL_USER_NOTE_STEPS = [
  "Reservar espacio en el formulario y esperar respuesta de confirmación de acuerdo a disponibilidad.",
  "Acudir a oficinas de Dirección con el Administrador Mtro. Valenzuela Salas para realizar el pago de la cuota correspondiente.",
] as const

/**
 * What the wizard form actually holds. Radio questions use "" for
 * "not answered yet" so the form can require an explicit choice; the two
 * date fields hold datetime-local strings in Tijuana wall time.
 * `wizardValuesToCreateData` converts this into the storage shape.
 */
export type EventWizardValues = Omit<CreateEventData, "isAuthorized" | "userType"> & {
  isAuthorized: "" | "si" | "no"
  userType: "" | UserType
}

/** Converts submitted wizard values into the payload the database layer stores. */
export function wizardValuesToCreateData(values: EventWizardValues): CreateEventData {
  const { isAuthorized, userType, ...rest } = values
  return {
    ...rest,
    isAuthorized: isAuthorized === "si",
    userType: userType === "externo" ? "externo" : "interno",
  }
}

/**
 * Prefills the wizard from a stored event (edit/resubmit flow). Dates come
 * back as Tijuana wall time for the datetime-local inputs. Radio questions on
 * events registered before those questions existed come back unanswered.
 */
export function eventToWizardValues(event: Event): Partial<EventWizardValues> {
  return {
    name: event.name,
    responsible: event.responsible,
    email: event.email,
    phone: event.phone,
    program: event.program,
    type: event.type,
    classification: event.classification,
    classificationOther: event.classificationOther,
    modality: event.modality,
    venue: event.venue,
    startDate: utcToTijuanaLocal(event.startDate),
    endDate: utcToTijuanaLocal(event.endDate),
    hasCost: event.hasCost,
    onlineInfo: event.onlineInfo,
    organizers: event.organizers,
    observations: event.observations,
    programDetails: event.programDetails,
    speakerCvs: event.speakerCvs,
    codigosRequeridos: event.codigosRequeridos,
    isAuthorized: event.isAuthorized === null ? "" : event.isAuthorized ? "si" : "no",
    userType: event.userType ?? "",
    seaesCategories: event.seaesCategories,
  }
}
