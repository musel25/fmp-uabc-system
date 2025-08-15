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
import { Calendar, Filter, Eye } from "lucide-react"
import { mockEvents, updateEventStatus } from "@/lib/mock-events"
import { useToast } from "@/hooks/use-toast"
import type { Event } from "@/lib/types"

export default function AdminReviewPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [filters, setFilters] = useState({
    program: "",
    status: "en_revision",
    startDate: "",
    endDate: "",
    search: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    // Load all events for admin review
    setEvents(mockEvents)
  }, [])

  useEffect(() => {
    // Apply filters
    let filtered = events

    if (filters.program) {
      filtered = filtered.filter((event) => event.program === filters.program)
    }

    if (filters.status) {
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
          event.responsible.toLowerCase().includes(searchLower) ||
          event.email.toLowerCase().includes(searchLower),
      )
    }

    setFilteredEvents(filtered)
  }, [events, filters])

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setIsDrawerOpen(true)
  }

  const handleEventReview = async (eventId: string, action: "approve" | "reject", comments?: string) => {
    const status = action === "approve" ? "aprobado" : "rechazado"
    const updatedEvent = updateEventStatus(eventId, status, comments)

    if (updatedEvent) {
      // Update local state
      setEvents((prev) => prev.map((event) => (event.id === eventId ? updatedEvent : event)))

      toast({
        title: action === "approve" ? "Evento aprobado" : "Evento rechazado",
        description: `El evento "${updatedEvent.name}" ha sido ${action === "approve" ? "aprobado" : "rechazado"} exitosamente`,
      })

      setIsDrawerOpen(false)
      setSelectedEvent(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-background">
        <Navbar showAdminToggle />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground-strong">Revisión de Eventos</h1>
            <p className="text-muted-foreground mt-1">Revisa y aprueba eventos pendientes de autorización</p>
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
                      <SelectItem value="borrador">Borrador</SelectItem>
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
              {filteredEvents.length === 0 ? (
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
                              <p className="font-medium">{event.responsible}</p>
                              <p className="text-sm text-muted-foreground">{event.email}</p>
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
