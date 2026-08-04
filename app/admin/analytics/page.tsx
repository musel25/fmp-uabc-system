"use client"

import { useEffect, useMemo, useState } from "react"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ChartFrame,
  SERIES,
  STATUS_SERIES,
  SemesterCurve,
  StackedSemesterBars,
} from "@/components/admin/semester-charts"
import {
  BarChart3,
  Download,
  Layers,
  LineChart as LineIcon,
  Loader2,
  Table2,
  TriangleAlert,
  Video,
} from "lucide-react"
import { getAllEvents } from "@/lib/supabase-admin"
import { semesterLabel, semesterOf, semesterRange } from "@/lib/semester"
import type { Event, EventModality, EventProgram, EventType } from "@/lib/types"

const PROGRAMS: EventProgram[] = ["Médico", "Psicología", "Nutrición", "Posgrado"]
const TYPES: EventType[] = ["Académico", "Cultural", "Deportivo", "Salud"]
const MODALITIES: EventModality[] = ["Presencial", "En línea", "Mixta"]
const STATUS_KEYS = ["Aprobados", "En revisión", "Rechazados"] as const
const STATUS_COLORS = [
  STATUS_SERIES.aprobado,
  STATUS_SERIES.en_revision,
  STATUS_SERIES.rechazado,
]

const ALL = "__all__"

type Row = Record<string, string | number>

/** Agrupa por ciclo escolar contando cuántos eventos caen en cada categoría. */
function tally<T extends string>(
  events: Event[],
  semesters: string[],
  keys: readonly T[],
  pick: (event: Event) => T | null,
): Row[] {
  const index = new Map<string, Row>()
  for (const semester of semesters) {
    const row: Row = { semester }
    for (const key of keys) row[key] = 0
    index.set(semester, row)
  }

  for (const event of events) {
    const semester = semesterOf(event.startDate)
    if (!semester) continue
    const row = index.get(semester)
    if (!row) continue
    const key = pick(event)
    if (key === null) continue
    row[key] = (row[key] as number) + 1
  }

  return semesters.map((s) => index.get(s)!)
}

export default function AdminAnalyticsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scope, setScope] = useState<string>(ALL)
  const [showTable, setShowTable] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const result = await getAllEvents(1, 1000)
        if (mounted) setEvents(result.events)
      } catch (e) {
        console.error("Load analytics error", e)
        if (mounted) setError("No se pudieron cargar los datos de los eventos.")
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const semesters = useMemo(
    () => semesterRange(events.map((e) => e.startDate)),
    [events],
  )

  const scoped = useMemo(
    () => (scope === ALL ? events : events.filter((e) => semesterOf(e.startDate) === scope)),
    [events, scope],
  )

  const stats = useMemo(() => {
    const by = (status: string) => scoped.filter((e) => e.status === status).length
    return {
      total: scoped.length,
      aprobado: by("aprobado"),
      en_revision: by("en_revision"),
      rechazado: by("rechazado"),
    }
  }, [scoped])

  const statusBySemester = useMemo(
    () =>
      tally(events, semesters, STATUS_KEYS, (e) =>
        e.status === "aprobado"
          ? "Aprobados"
          : e.status === "en_revision"
            ? "En revisión"
            : "Rechazados",
      ),
    [events, semesters],
  )

  const programBySemester = useMemo(
    () => tally(events, semesters, PROGRAMS, (e) => (PROGRAMS.includes(e.program) ? e.program : null)),
    [events, semesters],
  )

  const typeBySemester = useMemo(
    () => tally(events, semesters, TYPES, (e) => (TYPES.includes(e.type) ? e.type : null)),
    [events, semesters],
  )

  const modalityBySemester = useMemo(
    () =>
      tally(events, semesters, MODALITIES, (e) =>
        MODALITIES.includes(e.modality) ? e.modality : null,
      ),
    [events, semesters],
  )

  const curve = useMemo(
    () =>
      semesters.map((semester) => {
        const inSemester = events.filter((e) => semesterOf(e.startDate) === semester)
        return {
          semester,
          Registrados: inSemester.length,
          Aprobados: inSemester.filter((e) => e.status === "aprobado").length,
        }
      }),
    [events, semesters],
  )

  const exportSemesterCSV = () => {
    const header = [
      "Ciclo escolar",
      "Registrados",
      "Aprobados",
      "En revisión",
      "Rechazados",
      ...PROGRAMS,
      ...TYPES,
      ...MODALITIES,
    ]

    const rows = semesters.map((semester, i) => {
      const status = statusBySemester[i]
      const program = programBySemester[i]
      const type = typeBySemester[i]
      const modality = modalityBySemester[i]
      return [
        semester,
        curve[i].Registrados,
        status["Aprobados"],
        status["En revisión"],
        status["Rechazados"],
        ...PROGRAMS.map((p) => program[p]),
        ...TYPES.map((t) => type[t]),
        ...MODALITIES.map((m) => modality[m]),
      ]
    })

    downloadCSV(
      [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n"),
      `eventos_por_ciclo_${new Date().toISOString().slice(0, 10)}.csv`,
    )
  }

  const exportDetailCSV = () => {
    const header = [
      "No",
      "Nombre del evento",
      "Ciclo escolar",
      "Programa",
      "Tipo de evento",
      "Clasificación",
      "Modalidad",
      "Sede",
      "Fecha inicio",
      "Fecha final",
      "Estado",
      "Responsable",
      "Correo",
    ]

    const rows = scoped.map((e, i) => [
      i + 1,
      e.name,
      semesterOf(e.startDate) ?? "",
      e.program,
      e.type,
      e.classification,
      e.modality,
      e.venue,
      e.startDate?.slice(0, 10) ?? "",
      e.endDate?.slice(0, 10) ?? "",
      e.status,
      e.responsible ?? "",
      e.email ?? "",
    ])

    downloadCSV(
      [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n"),
      `eventos_detalle_${scope === ALL ? "todos" : scope}_${new Date().toISOString().slice(0, 10)}.csv`,
    )
  }

  const scopeLabel = scope === ALL ? "todos los ciclos" : `el ciclo ${scope}`

  return (
    <ProtectedRoute requireAdmin>
      <AppShell showAdminToggle>
        <PageHeader
          eyebrow="Administración"
          title="Panel de analíticas"
          description="Todo se agrupa por ciclo escolar UABC: 2026-1 abarca enero a junio y 2026-2 de julio a diciembre."
          actions={
            <>
              <Button variant="outline" onClick={() => setShowTable((v) => !v)}>
                {showTable ? (
                  <BarChart3 className="mr-2 h-4 w-4" aria-hidden="true" />
                ) : (
                  <Table2 className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                {showTable ? "Ver gráficas" : "Ver tabla"}
              </Button>
              <Button variant="outline" onClick={exportSemesterCSV}>
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                Resumen por ciclo
              </Button>
              <Button className="btn-primary" onClick={exportDetailCSV}>
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                Detalle de eventos
              </Button>
            </>
          }
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-24">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">Cargando datos…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--state-rejected-line)] bg-[var(--state-rejected-bg)] py-20 text-center">
            <TriangleAlert className="h-6 w-6 text-[var(--state-rejected)]" aria-hidden="true" />
            <h2 className="mt-3 font-display text-base font-semibold text-ink">{error}</h2>
            <Button
              variant="outline"
              className="mt-4 bg-card"
              onClick={() => window.location.reload()}
            >
              Volver a cargar
            </Button>
          </div>
        ) : semesters.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
            <BarChart3 className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
            <h2 className="mt-3 font-display text-base font-semibold text-ink">
              Todavía no hay eventos que analizar
            </h2>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              En cuanto se registre el primer evento aparecerán aquí los totales por ciclo escolar.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumen — el selector alcanza sólo a estas cifras; las gráficas
                muestran siempre la serie completa de ciclos. */}
            <section>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-lg font-semibold text-ink">
                  Resumen de {scopeLabel}
                </h2>
                <div className="flex items-center gap-2">
                  <label htmlFor="scope" className="text-sm text-muted-foreground">
                    Ciclo escolar
                  </label>
                  <Select value={scope} onValueChange={setScope}>
                    <SelectTrigger id="scope" className="w-44 bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>Todos los ciclos</SelectItem>
                      {[...semesters].reverse().map((s) => (
                        <SelectItem key={s} value={s}>
                          {s} · {semesterLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Eventos registrados" value={stats.total} />
                <StatCard label="Aprobados" value={stats.aprobado} tone="approved" />
                <StatCard label="En revisión" value={stats.en_revision} tone="pending" />
                <StatCard label="Rechazados" value={stats.rechazado} tone="rejected" />
              </div>
            </section>

            {showTable ? (
              <DataTable
                semesters={semesters}
                curve={curve}
                status={statusBySemester}
                program={programBySemester}
                type={typeBySemester}
                modality={modalityBySemester}
              />
            ) : (
              <>
                <ChartFrame
                  title="Total de eventos por ciclo escolar"
                  subtitle="Cada barra suma los eventos del ciclo, separados por el resultado de la revisión."
                  icon={<BarChart3 className="h-4 w-4 text-primary" aria-hidden="true" />}
                >
                  <StackedSemesterBars
                    data={statusBySemester}
                    keys={[...STATUS_KEYS]}
                    colors={STATUS_COLORS}
                    height={280}
                  />
                </ChartFrame>

                <div className="grid gap-6 xl:grid-cols-2">
                  <ChartFrame
                    title="Eventos por programa por ciclo"
                    subtitle="Composición de cada ciclo entre los cuatro programas educativos."
                    icon={<Layers className="h-4 w-4 text-primary" aria-hidden="true" />}
                  >
                    <StackedSemesterBars
                      data={programBySemester}
                      keys={PROGRAMS}
                      colors={SERIES}
                    />
                  </ChartFrame>

                  <ChartFrame
                    title="Tipos de evento por ciclo"
                    subtitle="Cómo se reparte cada ciclo entre académico, cultural, deportivo y salud."
                    icon={<Layers className="h-4 w-4 text-primary" aria-hidden="true" />}
                  >
                    <StackedSemesterBars data={typeBySemester} keys={TYPES} colors={SERIES} />
                  </ChartFrame>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <ChartFrame
                    title="Modalidad por ciclo"
                    subtitle="Presencial, en línea y mixta a lo largo de los ciclos."
                    icon={<Video className="h-4 w-4 text-primary" aria-hidden="true" />}
                  >
                    <StackedSemesterBars
                      data={modalityBySemester}
                      keys={MODALITIES}
                      colors={SERIES}
                    />
                  </ChartFrame>

                  <ChartFrame
                    title="Curva de eventos por ciclo"
                    subtitle="Trayectoria de los eventos registrados y de los que llegaron a aprobarse."
                    icon={<LineIcon className="h-4 w-4 text-primary" aria-hidden="true" />}
                  >
                    <SemesterCurve data={curve} height={260} />
                  </ChartFrame>
                </div>
              </>
            )}
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  )
}

function DataTable({
  semesters,
  curve,
  status,
  program,
  type,
  modality,
}: {
  semesters: string[]
  curve: Row[]
  status: Row[]
  program: Row[]
  type: Row[]
  modality: Row[]
}) {
  const columns = [
    "Registrados",
    ...STATUS_KEYS,
    ...PROGRAMS,
    ...TYPES,
    ...MODALITIES,
  ]

  return (
    <section className="card-uabc overflow-hidden">
      <div className="border-b border-border p-5">
        <h2 className="font-display text-base font-semibold text-ink">
          Eventos por ciclo escolar
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Los mismos datos de las gráficas, en cifras.
        </p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-card">Ciclo</TableHead>
              {columns.map((c) => (
                <TableHead key={c} className="whitespace-nowrap text-right">
                  {c}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {semesters.map((semester, i) => (
              <TableRow key={semester}>
                <TableCell className="font-data sticky left-0 bg-card text-xs font-medium text-ink">
                  {semester}
                  <span className="ml-2 font-sans text-[0.6875rem] font-normal text-muted-foreground">
                    {semesterLabel(semester)}
                  </span>
                </TableCell>
                <TableCell className="font-data text-right text-xs">
                  {curve[i].Registrados}
                </TableCell>
                {STATUS_KEYS.map((k) => (
                  <TableCell key={k} className="font-data text-right text-xs">
                    {status[i][k]}
                  </TableCell>
                ))}
                {PROGRAMS.map((k) => (
                  <TableCell key={k} className="font-data text-right text-xs">
                    {program[i][k]}
                  </TableCell>
                ))}
                {TYPES.map((k) => (
                  <TableCell key={k} className="font-data text-right text-xs">
                    {type[i][k]}
                  </TableCell>
                ))}
                {MODALITIES.map((k) => (
                  <TableCell key={k} className="font-data text-right text-xs">
                    {modality[i][k]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

function csvCell(value: string | number): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`
}

function downloadCSV(content: string, filename: string) {
  // BOM para que Excel abra los acentos correctamente.
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
