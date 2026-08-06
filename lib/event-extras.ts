import type { CreateEventData } from "./types"

/** Categorías del marco SEAES en las que puede enmarcarse un evento. */
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

/** Costos de renta de espacios para usuarios externos a UABC. */
export const EXTERNAL_USER_COSTS = [
  { space: "Aula Magna", cost: "$2,500" },
  { space: "Audiovisual", cost: "$2,500" },
  { space: "Sala de Desarrollo Humano", cost: "$1,500" },
  { space: "Salón (201–208) del Edif. 1A", cost: "$1,500" },
] as const

export const EXTERNAL_USER_NOTE_STEPS = [
  "Reservar espacio en el formulario y esperar respuesta de confirmación de acuerdo a disponibilidad.",
  "Acudir a oficinas de Dirección con el Administrador Mtro. Valenzuela Salas para realizar el pago de la cuota correspondiente.",
] as const

/** Respuestas del formulario que no tienen columna propia en la base de datos. */
export interface WizardExtras {
  isAuthorized: "" | "si" | "no"
  userType: "" | "interno" | "externo"
  seaesCategories: string[]
}

/** Campos completos que maneja el asistente de registro. */
export type EventWizardValues = CreateEventData & WizardExtras

// Se guardan dentro de `observations` como líneas etiquetadas para que el
// personal que revisa las vea sin cambiar el esquema de la base de datos.
const AUTH_LABEL = "Autorización de dirección o subdirección:"
const USER_LABEL = "Usuario UABC:"
const SEAES_LABEL = "Categorías SEAES:"

export function appendExtrasToObservations(
  observations: string | undefined,
  extras: WizardExtras,
): string {
  const lines = [
    `${AUTH_LABEL} ${extras.isAuthorized === "si" ? "Sí" : "No"}`,
    `${USER_LABEL} ${extras.userType === "externo" ? "Externo" : "Interno"}`,
  ]
  if (extras.seaesCategories.length > 0) {
    lines.push(`${SEAES_LABEL} ${extras.seaesCategories.join("; ")}`)
  }
  const base = observations?.trim()
  return base ? `${base}\n\n${lines.join("\n")}` : lines.join("\n")
}

/**
 * Separa las líneas etiquetadas del texto libre de observaciones, para que al
 * editar un evento cada respuesta regrese a su campo y no se duplique.
 */
export function parseExtrasFromObservations(observations: string | undefined): {
  observations: string
  extras: Partial<WizardExtras>
} {
  if (!observations) return { observations: "", extras: {} }

  const extras: Partial<WizardExtras> = {}
  const rest: string[] = []

  for (const line of observations.split("\n")) {
    const trimmed = line.trim()
    if (trimmed.startsWith(AUTH_LABEL)) {
      extras.isAuthorized = trimmed.slice(AUTH_LABEL.length).trim().toLowerCase() === "sí" ? "si" : "no"
    } else if (trimmed.startsWith(USER_LABEL)) {
      extras.userType = trimmed.slice(USER_LABEL.length).trim().toLowerCase() === "externo" ? "externo" : "interno"
    } else if (trimmed.startsWith(SEAES_LABEL)) {
      extras.seaesCategories = trimmed
        .slice(SEAES_LABEL.length)
        .split(";")
        .map((c) => c.trim())
        .filter(Boolean)
    } else {
      rest.push(line)
    }
  }

  return { observations: rest.join("\n").trim(), extras }
}
