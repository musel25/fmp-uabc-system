/**
 * El proceso, en un solo lugar.
 *
 * Las reglas del trámite (plazos, requisitos, enlaces) vivían repetidas en el
 * recordatorio del panel, en el paso de revisión del asistente, en la tarjeta
 * del evento y en la página de detalle — y ya se habían desincronizado entre sí.
 * Este módulo es la única fuente: la guía del proceso, los avisos por evento y
 * el texto del asistente se generan todos desde aquí.
 */

import type { Event, EventStatus } from "@/lib/types"

/** Anticipación mínima para registrar un evento. */
export const MIN_LEAD_DAYS = 21

/** Plazo para subir evidencias, contado desde que termina el evento. */
export const EVIDENCE_WINDOW_DAYS = 21

/** Límite de palabras en los campos largos del registro. */
export const MAX_WORDS_LONG_FIELD = 300

export const WORKFLOW_LINKS = {
  evidencias: "https://forms.gle/Dy5Kxns3DxijYzfh6",
  reservarEspacio:
    "https://docs.google.com/forms/d/e/1FAIpQLSfdntnwDSwszm_3MVBvkVjy831AAu1Ky0qkhjbpRI7MIqzpvg/viewform",
  plantillaDifusion:
    "https://docs.google.com/presentation/d/1jOYJ2OPRA_KgVFCYFG4gb9DIryGcAMX-/edit?usp=sharing&ouid=100348146339426668698&rtpof=true&sd=true",
  registroAsistencia: "https://forms.gle/GmP7enabiaKjuxqE8",
} as const

/** Etiqueta única del botón de evidencias — se usa en todas las pantallas. */
export const EVIDENCE_ACTION_LABEL = "Subir Evidencia para Constancia de Organizadores"

export interface WorkflowTask {
  text: string
  link?: { href: string; label: string }
}

export interface WorkflowPhase {
  /** Número de orden — el trámite sí es una secuencia con plazos. */
  step: string
  id: string
  title: string
  /** Cuándo ocurre, en relación con la fecha del evento. */
  when: string
  summary: string
  tasks: WorkflowTask[]
  /** Plazo duro que la gente suele pasar por alto. */
  deadline?: string
}

export const WORKFLOW_PHASES: WorkflowPhase[] = [
  {
    step: "01",
    id: "autorizacion",
    title: "Autorización interna",
    when: "Antes de registrar",
    summary:
      "Dirección o subdirección autoriza el evento. En el registro indicarás si ya cuentas con esa autorización.",
    tasks: [
      { text: "Envía tu propuesta a dirección o subdirección y espera su autorización." },
      {
        text: "Si el evento tiene costo, contacta al responsable de educación continua antes de continuar.",
      },
    ],
  },
  {
    step: "02",
    id: "registro",
    title: "Registro del evento",
    when: `Al menos ${MIN_LEAD_DAYS} días antes`,
    summary:
      "Captura el evento en la plataforma. El sistema no acepta fechas con menos de tres semanas de anticipación.",
    tasks: [
      { text: `Descripción del evento: horarios, temas y ponentes (máx. ${MAX_WORDS_LONG_FIELD} palabras).` },
      { text: `Semblanza curricular de ponentes: nombres, títulos y experiencia (máx. ${MAX_WORDS_LONG_FIELD} palabras).` },
      { text: "Organizadores tal como deben aparecer en las constancias, separados por punto y coma." },
      { text: "Número de códigos 8 = 1 requeridos." },
    ],
    deadline: `${MIN_LEAD_DAYS} días naturales antes de la fecha de inicio`,
  },
  {
    step: "03",
    id: "revision",
    title: "Revisión",
    when: "3 a 5 días hábiles",
    summary:
      "La coordinación revisa la solicitud. Mientras esté en revisión el evento no se puede editar.",
    tasks: [
      { text: "Recibirás el resultado por correo electrónico. Revisa también la carpeta de spam." },
      { text: "Si el evento se rechaza, podrás editarlo y enviarlo de nuevo con los ajustes indicados." },
    ],
  },
  {
    step: "04",
    id: "preparacion",
    title: "Preparación",
    when: "Después de la aprobación",
    summary:
      "Con el evento aprobado, entra de nuevo a la plataforma para reservar el espacio y preparar la difusión.",
    tasks: [
      {
        text: "Reserva el espacio donde se realizará el evento.",
        link: { href: WORKFLOW_LINKS.reservarEspacio, label: "Reservar espacio" },
      },
      {
        text: "Descarga la plantilla institucional de difusión.",
        link: { href: WORKFLOW_LINKS.plantillaDifusion, label: "Plantilla de difusión" },
      },
    ],
  },
  {
    step: "05",
    id: "durante",
    title: "Durante el evento",
    when: "El día del evento",
    summary:
      "Reúne lo que después se te pedirá como evidencia. Sin lista de asistencia no hay constancias.",
    tasks: [
      { text: "Recaba la lista de asistentes." },
      { text: "Toma fotografías del evento." },
      {
        text: "Registra la asistencia en el formulario institucional.",
        link: { href: WORKFLOW_LINKS.registroAsistencia, label: "Registro de asistencia" },
      },
    ],
  },
  {
    step: "06",
    id: "evidencias",
    title: "Evidencias y constancias",
    when: `Hasta ${EVIDENCE_WINDOW_DAYS} días después`,
    summary:
      "Sube las evidencias para que se emitan las constancias de los organizadores.",
    tasks: [
      {
        text: "Sube la lista de asistencia y las fotografías del evento.",
        link: { href: WORKFLOW_LINKS.evidencias, label: EVIDENCE_ACTION_LABEL },
      },
    ],
    deadline: `${EVIDENCE_WINDOW_DAYS} días naturales después de que termina el evento`,
  },
]

/* -------------------------------------------------------------------------- */
/* Fechas y plazos                                                            */
/* -------------------------------------------------------------------------- */

const DAY_MS = 24 * 60 * 60 * 1000

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

/** Compara por día natural, no por instante — "faltan 0 días" significa hoy. */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function daysUntil(target: Date, from: Date = new Date()): number {
  return Math.round((startOfDay(target).getTime() - startOfDay(from).getTime()) / DAY_MS)
}

/** Último día para subir evidencias: fin del evento + tres semanas. */
export function evidenceDeadline(event: Pick<Event, "endDate">): Date | null {
  if (!event.endDate) return null
  const end = new Date(event.endDate)
  if (Number.isNaN(end.getTime())) return null
  return addDays(end, EVIDENCE_WINDOW_DAYS)
}

/** Fecha límite para registrar un evento que inicia en `startDate`. */
export function registrationDeadline(startDate: string): Date | null {
  if (!startDate) return null
  const start = new Date(startDate)
  if (Number.isNaN(start.getTime())) return null
  return addDays(start, -MIN_LEAD_DAYS)
}

export function hasEventEnded(event: Pick<Event, "endDate">, now: Date = new Date()): boolean {
  if (!event.endDate) return false
  const end = new Date(event.endDate)
  if (Number.isNaN(end.getTime())) return false
  return end.getTime() < now.getTime()
}

export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Tijuana",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Tijuana",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function formatDateTime(dateISO: string): string {
  const date = new Date(dateISO)
  if (Number.isNaN(date.getTime())) return "Fecha no disponible"
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Tijuana",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

/** `12–14 mar 2026`, o una sola fecha cuando el evento dura un día. */
export function formatDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO)
  const end = new Date(endISO)
  if (Number.isNaN(start.getTime())) return "Fecha por definir"
  if (Number.isNaN(end.getTime())) return formatShortDate(start)

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()

  if (sameDay) return formatShortDate(start)

  const sameMonth =
    start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()

  if (sameMonth) {
    const day = new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Tijuana",
      day: "2-digit",
    }).format(start)
    return `${day}–${formatShortDate(end)}`
  }

  return `${formatShortDate(start)} – ${formatShortDate(end)}`
}

/* -------------------------------------------------------------------------- */
/* Qué sigue para un evento en concreto                                        */
/* -------------------------------------------------------------------------- */

export type NextStepTone = "info" | "action" | "urgent" | "done" | "blocked"

export interface EventNextStep {
  tone: NextStepTone
  /** Fase del proceso en la que está parado el evento. */
  phaseId: string
  title: string
  detail: string
  /** Texto del plazo, ya calculado con la fecha real del evento. */
  deadline?: string
  actions: Array<{ href: string; label: string }>
}

/**
 * Traduce el estado de un evento a la instrucción que le toca a la persona
 * ahora mismo, con la fecha límite real ya resuelta.
 */
export function nextStepFor(event: Event, now: Date = new Date()): EventNextStep {
  if (event.status === "en_revision") {
    return {
      tone: "info",
      phaseId: "revision",
      title: "En revisión por la coordinación",
      detail:
        "El resultado llega por correo en 3 a 5 días hábiles. Revisa también la carpeta de spam. Mientras tanto el evento no se puede editar.",
      actions: [],
    }
  }

  if (event.status === "rechazado") {
    return {
      tone: "blocked",
      phaseId: "revision",
      title: "Requiere cambios",
      detail:
        event.rejectionReason?.trim() ||
        "Revisa los comentarios de la coordinación, corrige la solicitud y vuelve a enviarla.",
      actions: [],
    }
  }

  // Aprobado — lo que sigue depende de si el evento ya ocurrió.
  const ended = hasEventEnded(event, now)

  if (!ended) {
    return {
      tone: "action",
      phaseId: "preparacion",
      title: "Aprobado — prepara el evento",
      detail:
        "Reserva el espacio y descarga la plantilla de difusión. El día del evento recaba la lista de asistentes y toma fotografías.",
      actions: [
        { href: WORKFLOW_LINKS.reservarEspacio, label: "Reservar espacio" },
        { href: WORKFLOW_LINKS.plantillaDifusion, label: "Plantilla de difusión" },
        { href: WORKFLOW_LINKS.registroAsistencia, label: "Registro de asistencia" },
      ],
    }
  }

  const deadline = evidenceDeadline(event)
  if (!deadline) {
    return {
      tone: "action",
      phaseId: "evidencias",
      title: "Sube las evidencias",
      detail: "Adjunta la lista de asistencia y las fotografías para solicitar las constancias.",
      actions: [{ href: WORKFLOW_LINKS.evidencias, label: EVIDENCE_ACTION_LABEL }],
    }
  }

  const remaining = daysUntil(deadline, now)

  if (remaining < 0) {
    return {
      tone: "urgent",
      phaseId: "evidencias",
      title: "Plazo de evidencias vencido",
      detail:
        "El plazo de tres semanas para subir evidencias terminó. Contacta a la coordinación para revisar tu caso.",
      deadline: `Venció el ${formatLongDate(deadline)}`,
      actions: [{ href: WORKFLOW_LINKS.evidencias, label: EVIDENCE_ACTION_LABEL }],
    }
  }

  return {
    tone: remaining <= 7 ? "urgent" : "action",
    phaseId: "evidencias",
    title: "Sube las evidencias para las constancias",
    detail:
      "Adjunta la lista de asistencia y las fotografías del evento para que se emitan las constancias de los organizadores.",
    deadline:
      remaining === 0
        ? `Último día: hoy, ${formatLongDate(deadline)}`
        : `Tienes ${remaining} día${remaining === 1 ? "" : "s"} — hasta el ${formatLongDate(deadline)}`,
    actions: [{ href: WORKFLOW_LINKS.evidencias, label: EVIDENCE_ACTION_LABEL }],
  }
}

/** Fase del proceso en la que se encuentra el evento, para resaltarla en la guía. */
export function currentPhaseId(event: Event, now: Date = new Date()): string {
  return nextStepFor(event, now).phaseId
}

/** Avisos que aplican a todos los eventos, mostrados al final del registro. */
export const SUBMISSION_NOTES: string[] = [
  `Se requieren al menos ${MIN_LEAD_DAYS} días naturales de anticipación respecto a la fecha de inicio.`,
  "Una vez enviado a revisión, no podrás editar el evento hasta recibir una respuesta.",
  "La revisión toma de 3 a 5 días hábiles y el resultado llega por correo — revisa la carpeta de spam.",
  "Tras la aprobación, entra de nuevo para reservar el espacio y descargar la plantilla de difusión.",
  "Durante el evento recaba la lista de asistentes y toma fotografías.",
  `Tienes ${EVIDENCE_WINDOW_DAYS} días después del evento para subir las evidencias y solicitar constancias.`,
]

export function statusLabel(status: EventStatus): string {
  switch (status) {
    case "aprobado":
      return "Aprobado"
    case "rechazado":
      return "Rechazado"
    default:
      return "En revisión"
  }
}
