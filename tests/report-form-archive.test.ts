import { expect, it } from "vitest"
import {
  parseReportFormCsv,
  archiveEntries,
  archiveSummary,
  safeEvidenceLinks,
} from "@/lib/report-form-archive"
import { event } from "./fixtures"

const headers = [
  "Marca temporal",
  "Dirección de correo electrónico",
  "ID del evento (ejemplo: UUID)",
  "Nombre de la actividad (escribir todo con mayúsculas)",
  "Indique el número total de asistentes, especificando cuántos fueron docentes, cuántos alumnos y cuántos integrantes de la comunidad en general.",
  "Incluya las listas de asistencia en este rubro",
  "Reseña del evento",
]
const quote = (s: string) => `"${s.replaceAll('"', '""')}"`
const csv = (rows: string[][]) =>
  [headers, ...rows].map((r) => r.map(quote).join(",")).join("\r\n")

it("preserves original questions, quoted commas, quotes and newlines", () => {
  const data = parseReportFormCsv(
    "\uFEFF" +
      csv([
        [
          "fecha",
          "a@example.test",
          event.id,
          "Nombre, actividad",
          "87",
          "https://drive.google.com/file/d/abc/view",
          'Texto con "comillas"\ny otra línea',
        ],
      ]),
  )
  expect(data.headers).toEqual(headers)
  expect(data.responses[0][6]).toBe('Texto con "comillas"\ny otra línea')
  const [entry] = archiveEntries(data, [event])
  expect(entry.event?.id).toBe(event.id)
  expect(entry.total).toBe(87)
  expect(entry.answers).toEqual(data.responses[0])
})

it("does not infer attendance totals or event associations from prose or names", () => {
  const data = parseReportFormCsv(
    csv([
      ["fecha", "", "", event.name, "10 docentes y 20 alumnos", "", ""],
      ["fecha", "", "otro id", event.name, "87 personas", "", ""],
      [
        "fecha",
        "",
        "00000000-0000-4000-8000-000000000099",
        event.name,
        "0",
        "",
        "",
      ],
    ]),
  )
  const entries = archiveEntries(data, [event])
  expect(entries.map((e) => e.event)).toEqual([null, null, null])
  expect(entries.map((e) => e.total)).toEqual([null, null, 0])
  expect(archiveSummary(entries)).toMatchObject({
    responses: 3,
    unmatched: 3,
    numericResponses: 1,
    total: 0,
    duplicateEvents: 0,
  })
})

it("flags multiple reports for the same event and excludes them from event totals", () => {
  const data = parseReportFormCsv(
    csv([
      ["fecha", "", event.id.toUpperCase(), "evento", "10", "", ""],
      ["fecha", "", event.id, "evento", "20", "", ""],
    ]),
  )
  expect(archiveSummary(archiveEntries(data, [event]))).toMatchObject({
    responses: 2,
    duplicateEvents: 1,
    uniqueEvents: 0,
    total: 0,
  })
})

it("rejects unrelated forms, malformed CSV and oversized imports", () => {
  expect(() =>
    parseReportFormCsv("Nombre,Correo\nAna,a@example.test"),
  ).toThrow()
  expect(() => parseReportFormCsv(csv([]) + '\n"unclosed')).toThrow()
  expect(() => parseReportFormCsv(csv([]) + '\n"value"junk,1')).toThrow()
  expect(() => parseReportFormCsv(csv([]) + "\n1,2")).toThrow()
  expect(() => parseReportFormCsv("a".repeat(5_000_001))).toThrow()
  expect(() => parseReportFormCsv(csv([]))).toThrow()
})

it("exposes only HTTPS evidence URLs without embedded credentials", () => {
  expect(
    safeEvidenceLinks(
      "javascript:alert(1), https://drive.google.com/open?id=abc, https://user:pass@example.test, http://example.test",
    ),
  ).toEqual(["https://drive.google.com/open?id=abc"])
})
