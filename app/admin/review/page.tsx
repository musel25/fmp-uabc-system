"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatCard } from "@/components/ui/stat-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { AdminEventReviewDrawer } from "@/components/admin/admin-event-review-drawer"
import {
  BarChart3,
  Download,
  Eye,
  Inbox,
  Loader2,
  RotateCcw,
  Search,
  TriangleAlert,
} from "lucide-react"
import { getEventsForReview, getAllEvents, approveEvent, rejectEvent } from "@/lib/supabase-admin"
import { useToast } from "@/hooks/use-toast"
import { formatDateRange } from "@/lib/workflow"
import { semesterOf } from "@/lib/semester"
import type { Event } from "@/lib/types"

const ALL = "all"

const EMPTY_FILTERS = {
  program: ALL,
  status: "en_revision",
  startDate: "",
  endDate: "",
  search: "",
}

export default function AdminReviewPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true

    const loadEvents = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const data =
          filters.status === "en_revision"
            ? await getEventsForReview()
            : (
                await getAllEvents(1, 500, {
                  status: filters.status === ALL ? undefined : filters.status,
                  program: filters.program === ALL ? undefined : filters.program,
                  search: filters.search,
                })
              ).events

        if (mounted) setEvents(data)
      } catch (err) {
        console.error("Load events error:", err)
        if (!mounted) return
        setError("No se pudieron cargar los eventos.")
        toast({
          title: "No se pudieron cargar los eventos",
          description: "Revisa tu conexión y vuelve a intentarlo.",
          variant: "destructive",
        })
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    loadEvents()
    return () => {
      mounted = false
    }
  }, [filters.status, filters.program, filters.search, toast])

  const filteredEvents = useMemo(() => {
    let list = events

    if (filters.program !== ALL) list = list.filter((e) => e.program === filters.program)
    if (filters.status !== ALL) list = list.filter((e) => e.status === filters.status)
    if (filters.startDate)
      list = list.filter((e) => new Date(e.startDate) >= new Date(filters.startDate))
    if (filters.endDate)
      list = list.filter((e) => new Date(e.startDate) <= new Date(`${filters.endDate}T23:59:59`))

    const term = filters.search.trim().toLowerCase()
    if (term) {
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(term) ||
          e.responsible?.toLowerCase().includes(term) ||
          e.email?.toLowerCase().includes(term),
      )
    }

    return [...list].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    )
  }, [events, filters])

  const pendingCount = useMemo(
    () => events.filter((e) => e.status === "en_revision").length,
    [events],
  )

  const handleEventReview = async (
    eventId: string,
    action: "approve" | "reject",
    comments?: string,
    rejectionReason?: string,
  ) => {
    try {
      let updated: Event

      if (action === "approve") {
        updated = await approveEvent(eventId, comments)
      } else {
        if (!rejectionReason?.trim()) {
          toast({
            title: "Falta el motivo del rechazo",
            description: "Escribe qué debe corregir la persona organizadora.",
            variant: "destructive",
          })
          return
        }
        updated = await rejectEvent(eventId, rejectionReason, comments)
      }

      setEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)))
      toast({
        title: action === "approve" ? "Evento aprobado" : "Evento rechazado",
        description: `"${updated.name}" quedó como ${action === "approve" ? "aprobado" : "rechazado"}.`,
      })

      setIsDrawerOpen(false)
      setSelectedEvent(null)
    } catch (err) {
      console.error("Event review error:", err)
      toast({
        title: "No se pudo guardar la revisión",
        description: "Vuelve a intentarlo en un momento.",
        variant: "destructive",
      })
    }
  }

  const exportToCSV = async () => {
    try {
      const { events: all } = await getAllEvents(1, 1000)
      const header = [
        "ID",
        "Nombre del evento",
        "Ciclo escolar",
        "Responsable",
        "Correo",
        "Teléfono",
        "Programa",
        "Tipo",
        "Clasificación",
        "Modalidad",
        "Sede",
        "Fecha inicio",
        "Fecha fin",
        "Tiene costo",
        "Organizadores",
        "Observaciones",
        "Estado",
        "Comentarios de la coordinación",
        "Motivo de rechazo",
        "Creado",
        "Actualizado",
      ]

      const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
      const rows = all.map((e) =>
        [
          e.id,
          e.name,
          semesterOf(e.startDate) ?? "",
          e.responsible ?? "",
          e.email ?? "",
          e.phone,
          e.program,
          e.type,
          e.classification,
          e.modality,
          e.venue,
          e.startDate,
          e.endDate,
          e.hasCost ? "Sí" : "No",
          e.organizers,
          e.observations ?? "",
          e.status,
          e.adminComments ?? "",
          e.rejectionReason ?? "",
          e.createdAt,
          e.updatedAt,
        ].map(cell).join(","),
      )

      const blob = new Blob(["﻿" + [header.map(cell).join(","), ...rows].join("\n")], {
        type: "text/csv;charset=utf-8;",
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `eventos_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Archivo descargado",
        description: `Se exportaron ${all.length} eventos.`,
      })
    } catch (err) {
      console.error("CSV export error:", err)
      toast({
        title: "No se pudo exportar",
        description: "Vuelve a intentarlo en un momento.",
        variant: "destructive",
      })
    }
  }

  const filtersActive = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS)

  return (
    <ProtectedRoute requireAdmin>
      <AppShell showAdminToggle>
        <PageHeader
          eyebrow="Administración"
          title="Revisión de eventos"
          description="Autoriza o devuelve las solicitudes que envían las personas organizadoras."
          actions={
            <>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                Exportar CSV
              </Button>
              <Button asChild className="btn-primary">
                <Link href="/admin/analytics">
                  <BarChart3 className="mr-2 h-4 w-4" aria-hidden="true" />
                  Analíticas
                </Link>
              </Button>
            </>
          }
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Esperando revisión"
            value={pendingCount}
            tone={pendingCount > 0 ? "pending" : "neutral"}
            caption={pendingCount > 0 ? "Solicitudes sin resolver" : "Bandeja al día"}
          />
          <StatCard label="En la vista actual" value={filteredEvents.length} />
          <StatCard
            label="Ciclo escolar en curso"
            value={
              <span className="font-data">{semesterOf(new Date().toISOString()) ?? "—"}</span>
            }
            caption="Los reportes se agrupan por este ciclo"
          />
        </div>

        <section className="card-uabc mt-6 p-5">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Label htmlFor="search" className="text-xs">
                Buscar
              </Label>
              <div className="relative mt-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="search"
                  type="search"
                  placeholder="Nombre, responsable o correo"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status" className="text-xs">
                Estado
              </Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger id="status" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_revision">En revisión</SelectItem>
                  <SelectItem value="aprobado">Aprobados</SelectItem>
                  <SelectItem value="rechazado">Rechazados</SelectItem>
                  <SelectItem value={ALL}>Todos los estados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="program" className="text-xs">
                Programa
              </Label>
              <Select
                value={filters.program}
                onValueChange={(value) => setFilters({ ...filters, program: value })}
              >
                <SelectTrigger id="program" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos los programas</SelectItem>
                  <SelectItem value="Médico">Médico</SelectItem>
                  <SelectItem value="Psicología">Psicología</SelectItem>
                  <SelectItem value="Nutrición">Nutrición</SelectItem>
                  <SelectItem value="Posgrado">Posgrado</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="startDate" className="text-xs">
                  Desde
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-xs">
                  Hasta
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {filtersActive && (
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Restablecer filtros
              </Button>
            </div>
          )}
        </section>

        <section className="card-uabc mt-6 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
              <p className="mt-3 text-sm text-muted-foreground">Cargando eventos…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <TriangleAlert
                className="h-6 w-6 text-[var(--state-rejected)]"
                aria-hidden="true"
              />
              <h2 className="mt-3 font-display text-base font-semibold text-ink">{error}</h2>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Volver a cargar
              </Button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Inbox className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
              <h2 className="mt-3 font-display text-base font-semibold text-ink">
                {filters.status === "en_revision"
                  ? "No hay solicitudes pendientes"
                  : "Ningún evento coincide con los filtros"}
              </h2>
              <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                {filters.status === "en_revision"
                  ? "Cuando alguien envíe un evento a revisión, aparecerá aquí."
                  : "Ajusta los filtros para ampliar la búsqueda."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Fechas</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id} className="hover:bg-surface-2/60">
                      <TableCell className="max-w-xs">
                        <p className="truncate font-medium text-ink">{event.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.classification} · {event.modality}
                        </p>
                      </TableCell>
                      <TableCell className="font-data whitespace-nowrap text-xs">
                        {formatDateRange(event.startDate, event.endDate)}
                      </TableCell>
                      <TableCell className="font-data text-xs text-muted-foreground">
                        {semesterOf(event.startDate) ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[14rem]">
                        <p className="truncate text-sm">{event.responsible || "—"}</p>
                        <p className="font-data truncate text-xs text-muted-foreground">
                          {event.email || "—"}
                        </p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{event.program}</TableCell>
                      <TableCell>
                        <StatusBadge status={event.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          className="btn-primary"
                          onClick={() => {
                            setSelectedEvent(event)
                            setIsDrawerOpen(true)
                          }}
                        >
                          <Eye className="mr-1.5 h-4 w-4" aria-hidden="true" />
                          {event.status === "en_revision" ? "Revisar" : "Ver"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <AdminEventReviewDrawer
          event={selectedEvent}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false)
            setSelectedEvent(null)
          }}
          onReview={handleEventReview}
        />
      </AppShell>
    </ProtectedRoute>
  )
}
