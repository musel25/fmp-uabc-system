"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { AdminEventReviewDrawer } from "@/components/admin/admin-event-review-drawer"
import { Calendar, Filter, Eye, Loader2, Download } from "lucide-react"
import { getEventsForReview, getAllEvents, approveEvent, rejectEvent } from "@/lib/supabase-admin"
import { useToast } from "@/hooks/use-toast"
import type { Event } from "@/lib/types"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"

export default function AdminReviewPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    program: "",
    status: "en_revision",
    startDate: "",
    endDate: "",
    search: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Load events based on filter status
        let eventsData: Event[]
        if (filters.status === "en_revision") {
          eventsData = await getEventsForReview()
        } else {
          const result = await getAllEvents(1, 100, {
            status: filters.status === "all" ? undefined : filters.status,
            program: filters.program === "all_programs" ? undefined : filters.program,
            search: filters.search
          })
          eventsData = result.events
        }

        setEvents(eventsData)
      } catch (error) {
        console.error('Load events error:', error)
        setError('Error al cargar los eventos')
        toast({
          title: "Error",
          description: "No se pudieron cargar los eventos",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()
  }, [filters.status, filters.program, filters.search, toast])

  useEffect(() => {
    // Apply filters
    let filtered = events

    if (filters.program) {
      filtered = filtered.filter((event) => event.program === filters.program)
    }

    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter((event) => event.status === filters.status)
    }

    if (filters.startDate) {
      filtered = filtered.filter((event) => new Date(event.startDate) >= new Date(filters.startDate))
    }

    if (filters.endDate) {
      filtered = filtered.filter((event) => new Date(event.startDate) <= new Date(filters.endDate))
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.name.toLowerCase().includes(searchLower) ||
          (event.responsible && event.responsible.toLowerCase().includes(searchLower)) ||
          (event.email && event.email.toLowerCase().includes(searchLower)),
      )
    }

    setFilteredEvents(filtered)
  }, [events, filters])

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setIsDrawerOpen(true)
  }

  const handleEventReview = async (eventId: string, action: "approve" | "reject", comments?: string, rejectionReason?: string) => {
    try {
      let updatedEvent: Event
      
      if (action === "approve") {
        updatedEvent = await approveEvent(eventId, comments)
      } else {
        if (!rejectionReason?.trim()) {
          toast({
            title: "Error",
            description: "El motivo de rechazo es requerido",
            variant: "destructive",
          })
          return
        }
        updatedEvent = await rejectEvent(eventId, rejectionReason, comments)
      }

      // Update local state
      setEvents((prev) => prev.map((event) => (event.id === eventId ? updatedEvent : event)))

      toast({
        title: action === "approve" ? "Evento aprobado" : "Evento rechazado",
        description: `El evento "${updatedEvent.name}" ha sido ${action === "approve" ? "aprobado" : "rechazado"} exitosamente`,
      })

      setIsDrawerOpen(false)
      setSelectedEvent(null)
    } catch (error) {
      console.error('Event review error:', error)
      toast({
        title: "Error",
        description: "No se pudo procesar la revisión del evento",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const exportToCSV = async () => {
    try {
      toast({
        title: "Exportando...",
        description: "Preparando archivo CSV",
      })

      // Get all events from database
      const result = await getAllEvents(1, 1000) // Get up to 1000 events
      const allEvents = result.events

      // Define CSV headers
      const headers = [
        "ID",
        "Nombre del Evento",
        "Responsable", 
        "Email",
        "Teléfono",
        "Programa",
        "Tipo",
        "Clasificación",
        "Modalidad",
        "Sede",
        "Fecha Inicio",
        "Fecha Fin",
        "Tiene Costo",
        "Detalles Costo",
        "Info Online",
        "Organizadores",
        "Observaciones",
        "Estado",
        "Estado Constancias",
        "Comentarios Admin",
        "Fecha Creación",
        "Fecha Actualización"
      ]

      // Convert events to CSV rows
      const csvRows = [
        headers.join(","),
        ...allEvents.map(event => [
          event.id,
          `"${event.name.replace(/"/g, '""')}"`,
          `"${(event.responsible || '').replace(/"/g, '""')}"`,
          event.email || '',
          event.phone,
          event.program,
          event.type,
          event.classification,
          event.modality,
          `"${event.venue.replace(/"/g, '""')}"`,
          event.startDate,
          event.endDate,
          event.hasCost ? "Sí" : "No",
          event.costDetails ? `"${event.costDetails.replace(/"/g, '""')}"` : "",
          event.onlineInfo ? `"${event.onlineInfo.replace(/"/g, '""')}"` : "",
          `"${event.organizers.replace(/"/g, '""')}"`,
          event.observations ? `"${event.observations.replace(/"/g, '""')}"` : "",
          event.status,
          event.certificateStatus,
          event.adminComments ? `"${event.adminComments.replace(/"/g, '""')}"` : "",
          event.createdAt,
          event.updatedAt
        ].join(","))
      ]

      // Create and download CSV file
      const csvContent = csvRows.join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      
      link.setAttribute("href", url)
      link.setAttribute("download", `eventos_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Exportación exitosa",
        description: `Se exportaron ${allEvents.length} eventos a CSV`,
      })
    } catch (error) {
      console.error("CSV export error:", error)
      toast({
        title: "Error en exportación",
        description: "No se pudo exportar el archivo CSV",
        variant: "destructive",
      })
    }
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <Navbar showAdminToggle />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground-strong">Revisión de Eventos</h1>
              <p className="text-muted-foreground mt-1">Revisa y aprueba eventos pendientes de autorización</p>
            </div>
            <Button onClick={exportToCSV} className="btn-secondary mt-4 sm:mt-0">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          {/* Filters */}
          <Card className="card-uabc mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div>
                  <Label htmlFor="search">Buscar</Label>
                  <Input
                    id="search"
                    placeholder="Nombre, responsable, email..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="program">Programa</Label>
                  <Select value={filters.program} onValueChange={(value) => setFilters({ ...filters, program: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Todos los programas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_programs">Todos los programas</SelectItem>
                      <SelectItem value="Médico">Médico</SelectItem>
                      <SelectItem value="Psicología">Psicología</SelectItem>
                      <SelectItem value="Nutrición">Nutrición</SelectItem>
                      <SelectItem value="Posgrado">Posgrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Estado</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="en_revision">En revisión</SelectItem>
                      <SelectItem value="aprobado">Aprobado</SelectItem>
                      <SelectItem value="rechazado">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="startDate">Fecha desde</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Fecha hasta</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() =>
                                      setFilters({
                    program: "all_programs",
                    status: "all",
                    startDate: "",
                    endDate: "",
                    search: "",
                  })
                  }
                >
                  Limpiar filtros
                </Button>
                <Badge variant="secondary" className="ml-auto">
                  {filteredEvents.length} evento{filteredEvents.length !== 1 ? "s" : ""} encontrado
                  {filteredEvents.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Events Table */}
          <Card className="card-uabc">
            <CardHeader>
              <CardTitle>Eventos para Revisión</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Cargando eventos...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="h-12 w-12 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Error al cargar eventos</h3>
                  <p className="text-muted-foreground mb-6">{error}</p>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Intentar de nuevo
                  </Button>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No hay eventos para mostrar</h3>
                  <p className="text-muted-foreground">
                    {filters.status === "en_revision"
                      ? "No hay eventos pendientes de revisión"
                      : "Ajusta los filtros para ver más eventos"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Evento</TableHead>
                        <TableHead>Fechas</TableHead>
                        <TableHead>Responsable</TableHead>
                        <TableHead>Programa</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents.map((event) => (
                        <TableRow key={event.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{event.name}</p>
                              <p className="text-sm text-muted-foreground">{event.classification}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{formatDate(event.startDate)}</p>
                              <p className="text-muted-foreground">{formatDate(event.endDate)}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{event.responsible || 'N/A'}</p>
                              <p className="text-sm text-muted-foreground">{event.email || 'N/A'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{event.program}</Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={event.status} />
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleEventClick(event)}>
                              <Eye className="h-4 w-4 mr-1" />
                              Revisar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
        <Footer />

        {/* Review Drawer */}
        <AdminEventReviewDrawer
          event={selectedEvent}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false)
            setSelectedEvent(null)
          }}
          onReview={handleEventReview}
        />
      </div>
    </ProtectedRoute>
  )
}
