"use client"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import { getReportAnalyticsRows } from "@/lib/supabase-reports"
import {
  filterReportRows,
  summarizeReports,
  reportCsvRows,
  type ReportAnalyticsRow,
} from "@/lib/report-analytics"
import { currentSemester, semesterOf } from "@/lib/semester"
import { createCsv, downloadCsv } from "@/lib/csv"
import type { Event } from "@/lib/types"
export function ReportAnalytics() {
  const [rows, setRows] = useState<ReportAnalyticsRow[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [semester, setSemester] = useState(() => currentSemester()),
    [program, setProgram] = useState(""),
    [eventId, setEventId] = useState(""),
    [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError("")
    void getReportAnalyticsRows()
      .then((r) => {
        if (active) setRows(r)
      })
      .catch(() => {
        if (active)
          setError(
            "No se pudieron cargar los resultados completos. Intenta de nuevo.",
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [reload])
  const filtered = useMemo(
    () =>
      filterReportRows(rows, {
        semester: semester || undefined,
        program: (program as Event["program"]) || undefined,
        eventId: eventId || undefined,
      }),
    [rows, semester, program, eventId],
  )
  const stats = useMemo(
    () => summarizeReports(filtered, new Date()),
    [filtered],
  )
  const semesters = Array.from(
    new Set([
      currentSemester(),
      ...rows
        .map((r) => semesterOf(r.event.startDate))
        .filter((s): s is string => !!s),
    ]),
  )
    .sort()
    .reverse()
  const chart = Array.from(
    new Set(
      filtered
        .map((r) => semesterOf(r.event.startDate))
        .filter((s): s is string => !!s),
    ),
  )
    .sort()
    .map((s) => {
      const v = summarizeReports(
        filtered.filter((r) => semesterOf(r.event.startDate) === s),
        new Date(),
      )
      return {
        semestre: s,
        Docentes: v.teacherCount,
        Alumnos: v.studentCount,
        Comunidad: v.communityCount,
      }
    })
  if (loading)
    return (
      <p className="py-10" role="status">
        Consultando resultados completos…
      </p>
    )
  if (error)
    return (
      <div className="card-uabc space-y-3 p-5">
        <p role="alert">{error}</p>
        <Button onClick={() => setReload((n) => n + 1)}>Reintentar</Button>
      </div>
    )
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl">Resultados de eventos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Asistencias declaradas en reportes enviados. Una persona puede
          participar en varios eventos; las respuestas de Google se muestran por
          separado.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          El semestre corresponde a la fecha del evento, aunque el reporte se
          entregue después. Al abrir esta vista se selecciona el semestre actual.
        </p>
      </header>
      <div className="no-print grid gap-4 sm:grid-cols-3">
        {[
          ["Semestre del evento", semester, setSemester, semesters.map((s) => [s, s])],
          [
            "Programa",
            program,
            setProgram,
            Array.from(new Set(rows.map((r) => r.event.program))).map((p) => [
              p,
              p,
            ]),
          ],
          [
            "Evento",
            eventId,
            setEventId,
            rows.map((r) => [r.event.id, r.event.name]),
          ],
        ].map(([label, value, set, options]) => (
          <label className="text-sm" key={label as string}>
            {label as string}
            <select
              className="mt-1 w-full rounded-md border bg-background p-2"
              value={value as string}
              onChange={(e) => (set as (s: string) => void)(e.target.value)}
            >
              <option value="">Todos</option>
              {(options as string[][]).map(([id, name]) => (
                <option value={id} key={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Asistencias reportadas"
          value={stats.totalAttendance}
        />
        <StatCard label="Reportes entregados" value={stats.reportedEvents} />
        <StatCard label="Reportes pendientes" value={stats.pendingEvents} />
        <StatCard label="Docentes" value={stats.teacherCount} />
        <StatCard label="Alumnos" value={stats.studentCount} />
        <StatCard label="Comunidad general" value={stats.communityCount} />
      </div>
      <p className="text-sm">
        Promedio por evento reportado:{" "}
        {stats.meanAttendance === null
          ? "Sin reportes"
          : stats.meanAttendance.toLocaleString("es-MX", {
              maximumFractionDigits: 1,
            })}{" "}
        · Entregas fuera de plazo: {stats.lateEvents}
      </p>
      {chart.length > 0 && (
        <section className="card-uabc p-5">
          <h2 className="font-display text-lg">
            Asistencia por semestre y categoría
          </h2>
          <div
            className="mt-4 h-72"
            role="img"
            aria-label="Gráfica de asistencias por semestre; cifras disponibles en la tabla y descargas"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semestre" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Docentes" fill="var(--series-1)" />
                <Bar dataKey="Alumnos" fill="var(--series-2)" />
                <Bar dataKey="Comunidad" fill="var(--series-3)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
      <div className="no-print flex flex-wrap gap-3">
        <Button
          onClick={() =>
            downloadCsv(
              createCsv(reportCsvRows(filtered)),
              "reportes-filtrados.csv",
            )
          }
        >
          Descargar reportes CSV
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            downloadCsv(
              createCsv([
                [
                  "Semestre",
                  "Programa",
                  "Evento",
                  "Reportes enviados",
                  "Pendientes",
                  "Tardíos",
                  "Docentes",
                  "Alumnos",
                  "Comunidad",
                  "Asistencias reportadas",
                  "Promedio",
                ],
                [
                  semester || "Todos",
                  program || "Todos",
                  eventId || "Todos",
                  stats.reportedEvents,
                  stats.pendingEvents,
                  stats.lateEvents,
                  stats.teacherCount,
                  stats.studentCount,
                  stats.communityCount,
                  stats.totalAttendance,
                  stats.meanAttendance,
                ],
              ]),
              "resumen-filtrado.csv",
            )
          }
        >
          Descargar resumen CSV
        </Button>
      </div>
      <div className="card-uabc overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {[
                "Evento",
                "Reporte",
                "Docentes",
                "Alumnos",
                "Comunidad",
                "Respuestas Google",
              ].map((label) => (
                <th className="p-3" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ event, report, progress }) => (
              <tr key={event.id} className="border-t">
                <td className="p-3">
                  <Link
                    className="text-primary underline"
                    href={`/events/${event.id}`}
                  >
                    {event.name}
                  </Link>
                </td>
                <td className="p-3">
                  {report?.status === "submitted"
                    ? "Recibido"
                    : report
                      ? "Borrador"
                      : progress.state === "loaded" &&
                          progress.tracking === "legacy"
                        ? "Sin seguimiento en plataforma"
                        : "Sin entrega"}
                </td>
                {[
                  report?.teacherCount,
                  report?.studentCount,
                  report?.communityCount,
                ].map((n, i) => (
                  <td className="p-3" key={i}>
                    {report?.status === "submitted" ? n : "—"}
                  </td>
                ))}
                <td className="p-3">
                  {progress.state === "loaded" &&
                  progress.attendance.state === "fresh"
                    ? progress.attendance.responseCount
                    : "Sin verificar"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <p className="p-5 text-sm">No hay eventos para estos filtros.</p>
        )}
      </div>
    </div>
  )
}
