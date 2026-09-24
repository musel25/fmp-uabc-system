import type { Event, EventProgress } from "./types"
import { canWaiveAttendanceList } from "./event-report"
export interface ChecklistItem {
  id: "registration" | "approval" | "preparation" | "attendance" | "report"
  state: "pending" | "active" | "done" | "unverified"
  title: string
  detail: string
  source: "system" | "organizer" | null
  href?: string
}
export function isPendingReport(
  event: Event,
  progress: EventProgress,
  now: Date,
): boolean | null {
  if (progress.state === "unavailable") return null
  return (
    event.status === "aprobado" &&
    new Date(event.endDate) <= now &&
    progress.tracking === "current" &&
    progress.report?.status !== "submitted"
  )
}
export function buildEventChecklist(
  event: Event,
  p: EventProgress,
  now: Date,
): ChecklistItem[] {
  const loaded = p.state === "loaded",
    approved = event.status === "aprobado",
    submitted = loaded && p.report?.status === "submitted"
  const prepared =
    loaded &&
    (event.modality === "En línea" || p.preparation.reservationDone) &&
    p.preparation.diffusionDone
  const attendance =
    submitted || (loaded && canWaiveAttendanceList(p.attendance, now))
  return [
    {
      id: "registration",
      state: "done",
      title: "Evento registrado",
      detail: "Tu solicitud está guardada.",
      source: "system",
    },
    {
      id: "approval",
      state: approved
        ? "done"
        : event.status === "rechazado"
          ? "active"
          : "pending",
      title: approved
        ? "Evento aprobado"
        : event.status === "rechazado"
          ? "Corregir solicitud"
          : "Esperar aprobación",
      detail:
        event.status === "rechazado"
          ? event.rejectionReason || "Revisa las observaciones de coordinación."
          : "Coordinación revisa la solicitud.",
      source: "system",
      href:
        event.status === "rechazado" ? `/events/${event.id}/edit` : undefined,
    },
    {
      id: "preparation",
      state: prepared ? "done" : approved ? "active" : "pending",
      title: "Preparar el evento",
      detail: prepared
        ? "Preparación confirmada por ti."
        : "Reserva el espacio y prepara la difusión. Estas confirmaciones son una ayuda, no bloquean el reporte.",
      source: prepared ? "organizer" : null,
    },
    {
      id: "attendance",
      state: attendance ? "done" : approved ? "unverified" : "pending",
      title: "Registrar asistencia de participantes",
      detail: submitted
        ? "La evidencia de asistencia quedó registrada con tu reporte."
        : loaded && p.attendance.state === "fresh"
          ? `${p.attendance.responseCount} respuestas recibidas. Cada participante debe llenar su registro.`
          : "Comparte el QR. La asistencia se verifica al recibir respuestas; también puedes presentar una lista alternativa.",
      source: attendance ? "system" : null,
      href: "#asistencia",
    },
    {
      id: "report",
      state: submitted
        ? "done"
        : !loaded
          ? "unverified"
          : approved && new Date(event.endDate) <= now
            ? "active"
            : "pending",
      title: submitted ? "Reporte recibido" : "Entregar reporte final",
      detail: submitted
        ? "Consulta tu entrega o envía correcciones."
        : loaded && p.tracking === "legacy"
          ? "Evento histórico: sin seguimiento de evidencias en plataforma."
          : "Completa asistencia, organizadores, evidencias y reseña dentro de los 21 días posteriores al evento.",
      source: submitted ? "system" : null,
      href: approved ? `/events/${event.id}/report` : undefined,
    },
  ]
}
