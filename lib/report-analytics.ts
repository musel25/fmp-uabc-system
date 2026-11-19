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

/** Final-report fields corresponding to the shared Google Form. */
export function reportQuestionSummary(rows: ReportAnalyticsRow[]) {
  const reports = rows.flatMap((r) =>
    r.report?.status === "submitted" ? [r.report] : [],
  )
  const count = (test: (r: EventReport) => boolean) =>
    reports.filter(test).length
  const teachers = reports.reduce((n, r) => n + r.teachers.length, 0)
  const students = reports.reduce((n, r) => n + r.students.length, 0)
  const totals = summarizeReports(rows, new Date())
  return [
    {
      key: "id",
      question: "ID del evento",
      answered: reports.length,
      summary: "Se asigna automáticamente desde el evento",
    },
    {
      key: "name",
      question: "Nombre de la actividad",
      answered: reports.length,
      summary: `${reports.length} eventos con reporte enviado`,
    },
    {
      key: "email",
      question: "Correo electrónico",
      answered: count((r) => !!r.email),
      summary: `${count((r) => !!r.email)} reportes con correo de contacto`,
    },
    {
      key: "attendance",
      question: "Número total de asistentes: docentes, alumnos y comunidad",
      answered: count(
        (r) =>
          r.teacherCount !== null &&
          r.studentCount !== null &&
          r.communityCount !== null,
      ),
      summary: `${totals.totalAttendance} asistencias: ${totals.teacherCount} docentes, ${totals.studentCount} alumnos y ${totals.communityCount} de comunidad`,
    },
    {
      key: "teachers",
      question: "Nombre completo y grado de los docentes organizadores",
      answered: count((r) => r.teacherMode !== null),
      summary: `${teachers} docentes organizadores en ${count((r) => r.teachers.length > 0)} reportes`,
    },
    {
      key: "students",
      question: "Nombre completo y nivel de los estudiantes organizadores",
      answered: count((r) => r.studentMode !== null),
      summary: `${students} estudiantes organizadores en ${count((r) => r.students.length > 0)} reportes`,
    },
    {
      key: "list",
      question: "Listas de asistencia",
      answered: count(
        (r) => !!r.attendanceListUrl || r.attendanceBasis === "google",
      ),
      summary: `${count((r) => !!r.attendanceListUrl)} reportes con lista adjunta; ${count((r) => r.attendanceBasis === "google")} con registro electrónico verificado`,
    },
    {
      key: "photos",
      question: "Fotos representativas del evento",
      answered: count((r) => r.photoUrls.length > 0),
      summary: `${count((r) => r.photoUrls.length > 0)} reportes con fotografías`,
    },
    {
      key: "narrative",
      question: "Reseña del evento",
      answered: count((r) => !!r.narrative.trim()),
      summary: `${count((r) => !!r.narrative.trim())} reportes con reseña`,
    },
  ]
}
