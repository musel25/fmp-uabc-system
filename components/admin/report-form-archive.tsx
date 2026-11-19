"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import { createCsv, downloadCsv } from "@/lib/csv"
import { formatDateTime } from "@/lib/workflow"
import { semesterOf } from "@/lib/semester"
import {
  archiveEntries,
  archiveSummary,
  parseReportFormCsv,
  REPORT_FORM_URL,
  safeEvidenceLinks,
  type ReportFormArchive as Archive,
  type ReportFormData,
} from "@/lib/report-form-archive"
import {
  getReportFormArchive,
  getReportFormEvents,
  saveReportFormArchive,
} from "@/lib/supabase-report-form"
import type { Event } from "@/lib/types"

export function ReportFormArchive() {
  const [archive, setArchive] = useState<Archive | null>(null)
  const [preview, setPreview] = useState<ReportFormData | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)
  const [reload, setReload] = useState(0)
  const [eventId, setEventId] = useState("")
  const [semester, setSemester] = useState("")
  const [page, setPage] = useState(0)
  const fileInput = useRef<HTMLInputElement>(null)
  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError("")
    void Promise.all([getReportFormArchive(), getReportFormEvents()])
      .then(([data, list]) => {
        if (active) {
          setArchive(data)
          setEvents(list)
          setPreview(null)
        }
      })
      .catch(() => {
        if (active)
          setLoadError(
            "No se pudieron cargar las respuestas del formulario. Reintenta. Si el problema continúa, solicita a soporte revisar la configuración del archivo histórico.",
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [reload])
  useEffect(() => setPage(0), [eventId, semester, archive, preview])
  const data = preview ?? archive
  const entries = useMemo(
    () => (data ? archiveEntries(data, events) : []),
    [data, events],
  )
  const filtered = entries.filter(
    (e) =>
      (!eventId ||
        (eventId === "unmatched" ? !e.event : e.event?.id === eventId)) &&
      (!semester || (e.event && semesterOf(e.event.startDate) === semester)),
  )
  const stats = archiveSummary(filtered)
  const previewStats = archiveSummary(entries)
  const linkedEvents = [
    ...new Map(
      entries.filter((e) => e.event).map((e) => [e.event!.id, e.event!]),
    ).values(),
  ]
  const semesters = [
    ...new Set(
      linkedEvents
        .map((e) => semesterOf(e.startDate))
        .filter((s): s is string => !!s),
    ),
  ]
    .sort()
    .reverse()
  const exportRows = (answers: string[][], filename: string) => {
    if (data) downloadCsv(createCsv([data.headers, ...answers]), filename)
  }
  async function readFile(file: File | undefined) {
    setError("")
    setNotice("")
    setPreview(null)
    if (!file) return
    setBusy(true)
    try {
      if (file.size > 5_000_000)
        throw new Error("El archivo supera el límite de 5 MB.")
      setPreview(parseReportFormCsv(await file.text()))
      setEventId("")
      setSemester("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer el CSV.")
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }
  async function save() {
    if (!preview) return
    setBusy(true)
    setError("")
    setNotice("")
    try {
      setArchive(await saveReportFormArchive(preview, archive?.version ?? 0))
      setPreview(null)
      setNotice(
        "Respuestas guardadas. Los administradores ya pueden consultarlas.",
      )
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo guardar el archivo.",
      )
    } finally {
      setBusy(false)
    }
  }
  if (loading)
    return (
      <p role="status" className="py-10">
        Consultando respuestas del formulario…
      </p>
    )
  if (loadError)
    return (
      <div className="card-uabc space-y-3 p-5">
        <p role="alert">{loadError}</p>
        <Button onClick={() => setReload((n) => n + 1)}>Reintentar</Button>
      </div>
    )
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl">
          Respuestas del formulario anterior
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          REPORTE FINAL de Eventos FMP. Cada respuesta es un reporte del
          organizador. Las listas de personas están en los archivos adjuntos.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Estos datos se consultan por separado de los reportes de la plataforma
          para evitar contar dos veces el mismo evento.
        </p>
      </header>
      <section className="card-uabc space-y-3 p-5">
        <h2 className="font-display text-lg">
          Importar respuestas de Google Forms
        </h2>
        <p className="text-sm">
          En{" "}
          <a
            className="text-primary underline"
            href={REPORT_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            el formulario compartido
          </a>
          , abre Respuestas → menú de tres puntos → Descargar respuestas (.csv).
          Si Google entrega un ZIP, extrae el CSV antes de seleccionarlo.
        </p>
        <p className="text-sm">
          Selecciona la exportación completa. Cada importación reemplaza la
          copia anterior. Google Forms conserva sus datos. La actualización es
          manual.
        </p>
        <label className="block text-sm">
          Archivo CSV (máximo 5 MB)
          <input
            ref={fileInput}
            className="mt-2 block max-w-full"
            type="file"
            accept=".csv,text/csv"
            disabled={busy}
            onChange={(e) => void readFile(e.target.files?.[0])}
          />
        </label>
        {archive && (
          <p className="text-sm text-muted-foreground">
            Última importación: {formatDateTime(archive.importedAt)} ·{" "}
            {archive.responses.length} respuestas guardadas.
          </p>
        )}
        {preview && (
          <div className="space-y-3 rounded-md border p-4">
            <p className="font-medium">
              Vista previa: {preview.responses.length} respuestas y{" "}
              {preview.headers.length} preguntas o campos.
            </p>
            <p className="text-sm">
              {previewStats.unmatched} sin evento vinculado.{" "}
              {previewStats.duplicateEvents} eventos con varios reportes. Puedes
              revisar las respuestas abajo antes de guardarlas.
            </p>
            {archive && (
              <p className="text-sm">
                Se reemplazarán las {archive.responses.length} respuestas
                guardadas.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy} onClick={() => void save()}>
                {busy ? "Guardando…" : "Guardar esta importación"}
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => setPreview(null)}
              >
                Cancelar vista previa
              </Button>
            </div>
          </div>
        )}
        {error && (
          <div role="alert" className="space-y-2">
            <p>{error}</p>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                setError("")
                setReload((n) => n + 1)
              }}
            >
              Recargar datos guardados
            </Button>
          </div>
        )}
        {notice && <p role="status">{notice}</p>}
      </section>
      {!data ? (
        <p>No hay respuestas importadas todavía.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              Evento
              <select
                aria-label="Evento"
                className="mt-1 w-full rounded-md border bg-background p-2"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="unmatched">Sin evento vinculado</option>
                {linkedEvents.map((e) => (
                  <option value={e.id} key={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Semestre del evento
              <select
                aria-label="Semestre del evento"
                className="mt-1 w-full rounded-md border bg-background p-2"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              >
                <option value="">Todos, incluidos los no vinculados</option>
                {semesters.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Respuestas" value={stats.responses} />
            <StatCard label="Sin evento vinculado" value={stats.unmatched} />
            <StatCard
              label="Eventos con varios reportes"
              value={stats.duplicateEvents}
            />
            <StatCard
              label="Asistencias con total numérico"
              value={stats.countedEvents ? stats.total : "Sin datos"}
              caption={`De ${stats.countedEvents} eventos con un solo reporte y total numérico.`}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            El total solo incluye eventos vinculados con un único reporte y una
            respuesta de asistencia formada solo por un número. Las respuestas
            en texto y los eventos con varios reportes requieren revisión. No se
            infiere el desglose por categoría.
          </p>
          <section className="card-uabc overflow-x-auto p-5">
            <h2 className="mb-3 font-display text-lg">
              Preguntas y respuestas recibidas
            </h2>
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="p-2">Pregunta o campo original</th>
                  <th className="p-2">Con respuesta</th>
                  <th className="p-2">Sin respuesta</th>
                </tr>
              </thead>
              <tbody>
                {data.headers.map((question, i) => {
                  const answered = filtered.filter((e) =>
                    e.answers[i]?.trim(),
                  ).length
                  return (
                    <tr className="border-t" key={i}>
                      <th scope="row" className="p-2 font-normal">
                        {question}
                      </th>
                      <td className="p-2">{answered}</td>
                      <td className="p-2">{filtered.length - answered}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
          <Button
            disabled={!filtered.length}
            onClick={() =>
              exportRows(
                filtered.map((e) => e.answers),
                eventId && eventId !== "unmatched"
                  ? `reporte-formulario-${eventId}.csv`
                  : "respuestas-formulario-filtradas.csv",
              )
            }
          >
            Descargar respuestas filtradas CSV
          </Button>
          <section
            className="space-y-3"
            aria-label="Respuestas completas por evento"
          >
            {filtered.slice(page * 20, (page + 1) * 20).map((entry) => (
              <details key={entry.row} className="card-uabc p-5">
                <summary className="cursor-pointer font-medium">
                  {entry.name} · Respuesta {entry.row} ·{" "}
                  {entry.event ? "Evento vinculado" : "Sin evento vinculado"}
                </summary>
                <div className="mt-4 space-y-4">
                  <p className="break-all text-sm">
                    ID: {entry.rawEventId || "No proporcionado"}
                    {entry.event && <> · {entry.event.name}</>}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      exportRows(
                        [entry.answers],
                        `reporte-formulario-${entry.event?.id ?? "sin-evento"}-${entry.row}.csv`,
                      )
                    }
                  >
                    Descargar respuestas de este reporte CSV
                  </Button>
                  <dl className="space-y-4">
                    {data.headers.map((question, i) => (
                      <div key={i}>
                        <dt className="text-sm font-medium">{question}</dt>
                        <dd className="mt-1 whitespace-pre-wrap break-words text-sm">
                          {entry.answers[i] || "Sin respuesta"}
                        </dd>
                        {safeEvidenceLinks(entry.answers[i]).map((url, j) => (
                          <a
                            key={url}
                            className="mr-4 mt-2 inline-block text-sm text-primary underline"
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Abrir archivo o enlace {j + 1}
                          </a>
                        ))}
                      </div>
                    ))}
                  </dl>
                  <p className="text-sm text-muted-foreground">
                    Para descargar una lista adjunta, abre su enlace y usa la
                    descarga de Google Drive. Se requiere permiso sobre el
                    archivo.
                  </p>
                </div>
              </details>
            ))}
            {!filtered.length && <p>No hay respuestas para estos filtros.</p>}
            {filtered.length > 20 && (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  disabled={!page}
                  onClick={() => setPage((n) => n - 1)}
                >
                  Anterior
                </Button>
                <span className="text-sm">
                  Página {page + 1} de {Math.ceil(filtered.length / 20)}
                </span>
                <Button
                  variant="outline"
                  disabled={(page + 1) * 20 >= filtered.length}
                  onClick={() => setPage((n) => n + 1)}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
