import type { Event } from "./types"

export const REPORT_FORM_ID = "1wGwLI7a9HDV1Gsy446XWzH3wacKkYfJoSiBAYTeqXk4"
export const REPORT_FORM_URL = `https://docs.google.com/forms/d/${REPORT_FORM_ID}/edit#responses`
export interface ReportFormData {
  headers: string[]
  responses: string[][]
}
export interface ReportFormArchive extends ReportFormData {
  version: number
  importedAt: string
}
export interface ArchiveEntry {
  row: number
  event: Event | null
  name: string
  rawEventId: string
  total: number | null
  answers: string[]
}
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
export function reportFormColumns(headers: string[]) {
  const normalized = headers.map(normalize)
  return {
    eventId: normalized.findIndex((h) => h.startsWith("id del evento")),
    name: normalized.findIndex((h) => h.startsWith("nombre de la actividad")),
    attendance: normalized.findIndex((h) =>
      h.includes("numero total de asistentes"),
    ),
    list: normalized.findIndex((h) => h.includes("listas de asistencia")),
  }
}

/** Google Forms CSV: RFC 4180 quoting, including multiline answers. */
export function parseReportFormCsv(contents: string): ReportFormData {
  if (new TextEncoder().encode(contents).length > 5_000_000)
    throw new Error("El archivo supera el límite de 5 MB.")
  const text = contents.replace(/^\uFEFF/, "")
  const rows: string[][] = []
  let row: string[] = [],
    cell = "",
    quoted = false,
    closed = false
  const endCell = () => {
    row.push(cell)
    cell = ""
    closed = false
  }
  const endRow = () => {
    endCell()
    if (row.some((v) => v !== "")) rows.push(row)
    row = []
  }
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          quoted = false
          closed = true
        }
      } else cell += c
    } else if (c === ",") endCell()
    else if (c === "\r" || c === "\n") {
      endRow()
      if (c === "\r" && text[i + 1] === "\n") i++
    } else if (c === '"' && !cell && !closed) quoted = true
    else {
      if (closed || c === '"')
        throw new Error(
          "El CSV tiene comillas incorrectas. Descarga de nuevo el archivo desde Google Forms.",
        )
      cell += c
    }
  }
  if (quoted)
    throw new Error("El CSV está incompleto: falta cerrar una respuesta.")
  if (cell || closed || row.length) endRow()
  const [headers = [], ...responses] = rows
  const columns = reportFormColumns(headers)
  if (headers.length > 50 || Object.values(columns).some((i) => i < 0))
    throw new Error(
      "Selecciona el CSV de «REPORTE FINAL de Eventos FMP». Faltan preguntas de ese formulario.",
    )
  if (!responses.length || responses.length > 5000)
    throw new Error("El archivo debe contener entre 1 y 5000 respuestas.")
  if (responses.some((r) => r.length !== headers.length))
    throw new Error(
      "El CSV contiene filas incompletas. Descarga de nuevo el archivo desde Google Forms.",
    )
  return { headers, responses }
}

export function archiveEntries(
  data: ReportFormData,
  events: Event[],
): ArchiveEntry[] {
  const columns = reportFormColumns(data.headers)
  const byId = new Map(events.map((e) => [e.id.toLowerCase(), e]))
  return data.responses.map((answers, index) => {
    const rawEventId = answers[columns.eventId]?.trim() ?? ""
    const attendance = answers[columns.attendance]?.trim() ?? ""
    return {
      row: index + 1,
      event: byId.get(rawEventId.toLowerCase()) ?? null,
      rawEventId,
      name: answers[columns.name] || "Sin nombre",
      total:
        /^\d{1,7}$/.test(attendance) && Number(attendance) <= 1_000_000
          ? Number(attendance)
          : null,
      answers,
    }
  })
}

export function archiveSummary(entries: ArchiveEntry[]) {
  const groups = new Map<string, ArchiveEntry[]>()
  for (const entry of entries)
    if (entry.event) {
      const group = groups.get(entry.event.id) ?? []
      group.push(entry)
      groups.set(entry.event.id, group)
    }
  const unique = [...groups.values()]
    .filter((g) => g.length === 1)
    .map((g) => g[0])
  const numeric = unique.filter((e) => e.total !== null)
  return {
    responses: entries.length,
    unmatched: entries.filter((e) => !e.event).length,
    duplicateEvents: [...groups.values()].filter((g) => g.length > 1).length,
    uniqueEvents: unique.length,
    numericResponses: entries.filter((e) => e.total !== null).length,
    countedEvents: numeric.length,
    total: numeric.reduce((n, e) => n + e.total!, 0),
  }
}

export function safeEvidenceLinks(value: string): string[] {
  return [
    ...new Set(
      (value.match(/https:\/\/[^\s,<>" ]+/g) ?? []).filter((s) => {
        try {
          const url = new URL(s)
          return url.protocol === "https:" && !url.username && !url.password
        } catch {
          return false
        }
      }),
    ),
  ]
}
