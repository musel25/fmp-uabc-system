import type { Event, EventReport, EventProgress } from "./types"
import { evidenceDeadline, formatDateTime } from "./workflow"
import { semesterOf } from "./semester"
import { isPendingReport } from "./event-progress"
export interface ReportFilters {
  semester?: string
  program?: Event["program"]
  eventId?: string
}
export interface ReportAnalyticsRow {
  event: Event
  report: EventReport | null
  progress: EventProgress
}
export function filterReportRows(
  rows: ReportAnalyticsRow[],
  filters: ReportFilters,
): ReportAnalyticsRow[] {
  return rows.filter(
    ({ event }) =>
      (!filters.semester || semesterOf(event.startDate) === filters.semester) &&
      (!filters.program || event.program === filters.program) &&
      (!filters.eventId || event.id === filters.eventId),
  )
}
export function summarizeReports(rows: ReportAnalyticsRow[], now: Date) {
  const submitted = rows.filter((r) => r.report?.status === "submitted")
  const sum = (key: "teacherCount" | "studentCount" | "communityCount") =>
    submitted.reduce((n, r) => n + (r.report![key] ?? 0), 0)
  const teacherCount = sum("teacherCount"),
    studentCount = sum("studentCount"),
    communityCount = sum("communityCount"),
    totalAttendance = teacherCount + studentCount + communityCount
  return {
    reportedEvents: submitted.length,
    pendingEvents: rows.filter(
      (r) => isPendingReport(r.event, r.progress, now) === true,
    ).length,
    lateEvents: submitted.filter((r) => {
      const deadline = evidenceDeadline(r.event)
      return deadline && new Date(r.report!.firstSubmittedAt!) > deadline
    }).length,
    teacherCount,
    studentCount,
    communityCount,
    totalAttendance,
    meanAttendance: submitted.length
      ? totalAttendance / submitted.length
      : null,
  }
}
export function reportCsvRows(
  rows: ReportAnalyticsRow[],
): Array<Array<string | number | null>> {
  return [
    [
      "ID",
      "Evento",
      "Semestre",
      "Programa",
      "Inicio (Tijuana)",
      "Fin (Tijuana)",
      "Correo",
      "Docentes",
      "Alumnos",
      "Comunidad",
      "Asistencias reportadas",
      "Docentes organizadores",
      "Estudiantes organizadores",
      "Lista",
      "Fotos",
      "Reseña",
      "Primer envío",
      "Último envío",
      "Evidencia de asistencia",
      "Respuestas verificadas al enviar",
      "Snapshot usado",
    ],
    ...rows
      .filter((r) => r.report?.status === "submitted")
      .map(({ event: e, report: r }) => [
        e.id,
        r!.eventName,
        semesterOf(e.startDate),
        e.program,
        formatDateTime(e.startDate),
        formatDateTime(e.endDate),
        r!.email,
        r!.teacherCount,
        r!.studentCount,
        r!.communityCount,
        (r!.teacherCount ?? 0) +
          (r!.studentCount ?? 0) +
          (r!.communityCount ?? 0),
        r!.teachers.map((p) => `${p.degree} ${p.name}`).join("; "),
        r!.students.map((p) => `${p.name} (${p.level})`).join("; "),
        r!.attendanceListUrl,
        r!.photoUrls.join("; "),
        r!.narrative,
        formatDateTime(r!.firstSubmittedAt!),
        formatDateTime(r!.submittedAt!),
        r!.attendanceBasis === "google"
          ? "Registro electrónico"
          : "Lista alternativa",
        r!.verifiedResponseCount,
        r!.verifiedSnapshotAt ? formatDateTime(r!.verifiedSnapshotAt) : null,
      ]),
  ]
}
