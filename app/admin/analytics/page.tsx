"use client"

import { useEffect, useMemo, useState } from "react"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { Loader2, BarChart2, PieChart as PieIcon, LineChart as LineIcon, Calendar, Download } from "lucide-react"
import { getAllEvents } from "@/lib/supabase-admin"
import type { Event } from "@/lib/types"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export default function AdminAnalyticsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const result = await getAllEvents(1, 1000)
        setEvents(result.events)
      } catch (e) {
        console.error("Load analytics error", e)
        setError("No se pudieron cargar los datos")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const exportReportToCSV = async () => {
    try {
      // Define report headers
      const headers = [
        "No",
        "Nombre del evento",
        "Tipo de evento",
        "Ciclo escolar",
        "Fecha inicio",
        "Fecha final",
        "Estudiantes que asistieron",
      ]

      const toCsvSafe = (value: string | number | null | undefined) => {
        const s = String(value ?? "")
        // Wrap in quotes and escape quotes
        return `"${s.replace(/"/g, '""')}"`
      }

      const toYMD = (dateStr?: string) => {
        if (!dateStr) return ""
        // Prefer simple slice to avoid timezone shifts
        return dateStr.slice(0, 10)
      }

      const cicloEscolar = (start?: string) => {
        if (!start) return ""
        const year = new Date(start).getUTCFullYear()
        // Specified rule: all 2025 dates => 2025-2; fallback generalized pattern `${year}-2` otherwise
        return year === 2025 ? "2025-2" : `${year}-2`
      }

      const rows = [
        headers.join(","),
        ...events.map((e, idx) => [
          idx + 1, // No
          toCsvSafe(e.name), // Nombre del evento
          toCsvSafe(e.type || e.classification || ""), // Tipo de evento
          toCsvSafe(cicloEscolar(e.startDate)), // Ciclo escolar
          toCsvSafe(toYMD(e.startDate)), // Fecha inicio
          toCsvSafe(toYMD(e.endDate)), // Fecha final
          "", // Estudiantes que asistieron (left blank)
        ].join(","))
      ]

      const csvContent = rows.join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.href = url
      link.download = `reporte_analiticas_${new Date().toISOString().split('T')[0]}.csv`
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("CSV report export error:", error)
    }
  }

  const exportTotalEventsToCSV = async () => {
    try {
      // Fetch the freshest data
      const result = await getAllEvents(1, 1000)
      const allEvents = result.events

      // Helper to safely format cells
      const toCsvSafe = (value: string | number | null | undefined) => {
        const s = String(value ?? "")
        return `"${s.replace(/"/g, '""')}"`
      }

      // Period for report and target year
      const PERIODO = "2025-2"
      const TARGET_YEAR = 2025

      // Normalize type to one of the 6 categories
      const CATEGORIES = [
        "Académico",
        "Cultural",
        "Deportivo",
        "Social",
        "Salud",
        "Otro",
      ] as const

      const counts: Record<(typeof CATEGORIES)[number], number> = {
        Académico: 0,
        Cultural: 0,
        Deportivo: 0,
        Social: 0,
        Salud: 0,
        Otro: 0,
      }

      const yearFromISO = (dateStr?: string | null) => {
        if (!dateStr) return NaN
        const y = Number(String(dateStr).slice(0, 4))
        if (!Number.isNaN(y)) return y
        const d = new Date(dateStr)
        return d.getUTCFullYear()
      }

      for (const e of allEvents) {
        // Optional quality filter: only approved
        if (e.status !== "aprobado") continue

        // Filter by year of start date
        const y = yearFromISO(e.startDate)
        if (y !== TARGET_YEAR) continue

        const rawType = (e.type || e.classification || "").trim()
        const cat = (CATEGORIES as readonly string[]).includes(rawType)
          ? (rawType as (typeof CATEGORIES)[number])
          : "Otro"

        counts[cat] += 1
      }

      const total =
        counts["Académico"] +
        counts["Cultural"] +
        counts["Deportivo"] +
        counts["Social"] +
        counts["Salud"] +
        counts["Otro"]

      // Build CSV
      const rows: string[] = []
      // Header fields
      rows.push([toCsvSafe("Programa"), toCsvSafe("")].join(","))
      rows.push([toCsvSafe("Periodo"), toCsvSafe(PERIODO)].join(","))
      rows.push("") // blank line

      // Table header
      rows.push([toCsvSafe("Tipo de evento"), toCsvSafe("Eventos")].join(","))
      // Rows per category in the required order
      rows.push([toCsvSafe("Académico"), String(counts["Académico"])].join(","))
      rows.push([toCsvSafe("Cultural"), String(counts["Cultural"])].join(","))
      rows.push([toCsvSafe("Deportivo"), String(counts["Deportivo"])].join(","))
      rows.push([toCsvSafe("Social"), String(counts["Social"])].join(","))
      rows.push([toCsvSafe("Salud"), String(counts["Salud"])].join(","))
      rows.push([toCsvSafe("Otro"), String(counts["Otro"])].join(","))
      // Suma row
      rows.push([toCsvSafe("Suma"), String(total)].join(","))

      const csvContent = rows.join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.href = url
      link.download = `total_eventos_por_tipo_${new Date().toISOString().split('T')[0]}.csv`
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("CSV total export error:", error)
    }
  }

  // Derived metrics
  const stats = useMemo(() => {
    const total = events.length
    const approved = events.filter((e) => e.status === "aprobado").length
    const pending = events.filter((e) => e.status === "en_revision").length
    const rejected = events.filter((e) => e.status === "rechazado").length

    // This month
    const now = new Date()
    const thisMonth = events.filter((e) => {
      const d = new Date(e.createdAt)
      return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth()
    }).length

    return { total, approved, pending, rejected, thisMonth }
  }, [events])

  const programData = useMemo(() => {
    const programs = ["Médico", "Psicología", "Nutrición", "Posgrado"] as const
    return programs.map((p) => ({ name: p, count: events.filter((e) => e.program === p).length }))
  }, [events])

  const typeData = useMemo(() => {
    const types = ["Académico", "Cultural", "Deportivo", "Salud"] as const
    return types.map((t) => ({ name: t, count: events.filter((e) => e.type === t).length }))
  }, [events])

  const modalityData = useMemo(() => {
    const modalities = ["Presencial", "En línea", "Mixta"] as const
    return modalities.map((m, idx) => ({ name: m, value: events.filter((e) => e.modality === m).length, fill: `var(--color-chart-${(idx % 5) + 1})` }))
  }, [events])

  const timelineData = useMemo(() => {
    // Last 12 months counts
    const months: { key: string; label: string; total: number; approved: number }[] = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
      const label = d.toLocaleString("es-MX", { month: "short" }) + " " + String(d.getUTCFullYear()).slice(2)
      months.push({ key, label, total: 0, approved: 0 })
    }
    const bucket = new Map(months.map((m) => [m.key, m]))
    for (const e of events) {
      const d = new Date(e.createdAt)
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
      const m = bucket.get(key)
      if (m) {
        m.total += 1
        if (e.status === "aprobado") m.approved += 1
      }
    }
    return months
  }, [events])

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <Navbar showAdminToggle />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 flex-1 w-full">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-foreground-strong">Panel de Analíticas</h1>
              <p className="text-muted-foreground mt-1">Resumen y tendencias de los eventos</p>
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <Button onClick={exportReportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Descargar Reporte Eventos
              </Button>
              <Button onClick={exportTotalEventsToCSV} variant="secondary">
                <Download className="h-4 w-4 mr-2" />
                Descargar Total de eventos
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-24">
              <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Error al cargar datos</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stat cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <Card className="card-uabc">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Total de eventos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground mt-1">Acumulado histórico</p>
                  </CardContent>
                </Card>
                <Card className="card-uabc">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Aprobados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
                    <p className="text-xs text-muted-foreground mt-1">Eventos con aprobación</p>
                  </CardContent>
                </Card>
                <Card className="card-uabc">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">En revisión</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-600">{stats.pending}</div>
                    <p className="text-xs text-muted-foreground mt-1">Pendientes de revisión</p>
                  </CardContent>
                </Card>
                <Card className="card-uabc">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Rechazados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
                    <p className="text-xs text-muted-foreground mt-1">Eventos rechazados</p>
                  </CardContent>
                </Card>
                <Card className="card-uabc">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Este mes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.thisMonth}</div>
                    <p className="text-xs text-muted-foreground mt-1">Eventos creados</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts grid */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* By program */}
                <Card className="card-uabc">
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><BarChart2 className="h-4 w-4" />Eventos por programa</CardTitle>
                    <Badge variant="secondary">{events.length}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ChartContainer
                        config={{ count: { label: "Eventos", color: "var(--color-chart-1)" } }}
                      >
                        <BarChart data={programData}>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} tickMargin={8} />
                          <YAxis allowDecimals={false} />
                          <Tooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* By type */}
                <Card className="card-uabc">
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><BarChart2 className="h-4 w-4" />Eventos por tipo</CardTitle>
                    <Badge variant="secondary">{events.length}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ChartContainer
                        config={{ count: { label: "Eventos", color: "var(--color-chart-2)" } }}
                      >
                        <BarChart data={typeData}>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} tickMargin={8} />
                          <YAxis allowDecimals={false} />
                          <Tooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Modality pie */}
                <Card className="card-uabc">
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><PieIcon className="h-4 w-4" />Modalidad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer>
                        <PieChart>
                          <Tooltip />
                          <Legend />
                          <Pie data={modalityData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline */}
              <Card className="card-uabc">
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><LineIcon className="h-4 w-4" />Eventos por mes (últimos 12)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ChartContainer
                      config={{ total: { label: "Total", color: "var(--color-chart-3)" }, approved: { label: "Aprobados", color: "var(--color-chart-4)" } }}
                    >
                      <LineChart data={timelineData}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line type="monotone" dataKey="total" stroke="var(--color-chart-3)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="approved" stroke="var(--color-chart-4)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
