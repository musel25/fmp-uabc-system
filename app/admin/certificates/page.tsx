"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/status-badge"
import { AdminCertificateDrawer } from "@/components/admin/admin-certificate-drawer"
import { Award, Eye, Calendar } from "lucide-react"
import { mockEvents, updateEvent } from "@/lib/mock-events"
import { useToast } from "@/hooks/use-toast"
import type { Event } from "@/lib/types"

export default function AdminCertificatesPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Load approved events that might have certificate requests
    const approvedEvents = mockEvents.filter((event) => event.status === "aprobado")
    setEvents(approvedEvents)
  }, [])

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setIsDrawerOpen(true)
  }

  const handleMarkAsIssued = async (eventId: string) => {
    const updatedEvent = updateEvent(eventId, { certificateStatus: "emitidas" })

    if (updatedEvent) {
      setEvents((prev) => prev.map((event) => (event.id === eventId ? updatedEvent : event)))

      toast({
        title: "Constancias marcadas como emitidas",
        description: `Las constancias del evento "${updatedEvent.name}" han sido marcadas como emitidas`,
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

  const eventsWithCertificateRequests = events.filter((event) => event.certificateStatus !== "sin_solicitar")

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-background">
        <Navbar showAdminToggle />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground-strong">Gestión de Constancias</h1>
            <p className="text-muted-foreground mt-1">Administra las solicitudes de constancias de eventos aprobados</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="card-uabc">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Eventos Aprobados</p>
                    <p className="text-2xl font-bold">{events.length}</p>
                  </div>
                  <Award className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-uabc">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Constancias Solicitadas</p>
                    <p className="text-2xl font-bold">
                      {events.filter((e) => e.certificateStatus === "solicitadas").length}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-uabc">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Constancias Emitidas</p>
                    <p className="text-2xl font-bold">
                      {events.filter((e) => e.certificateStatus === "emitidas").length}
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Events Table */}
          <Card className="card-uabc">
            <CardHeader>
              <CardTitle>Eventos con Solicitudes de Constancias</CardTitle>
            </CardHeader>
            <CardContent>
              {eventsWithCertificateRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No hay solicitudes de constancias</h3>
                  <p className="text-muted-foreground">
                    Las solicitudes de constancias aparecerán aquí cuando los organizadores las envíen
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Evento</TableHead>
                        <TableHead>Fecha del Evento</TableHead>
                        <TableHead>Responsable</TableHead>
                        <TableHead>Estado Constancias</TableHead>
                        <TableHead>Fecha Solicitud</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventsWithCertificateRequests.map((event) => (
                        <TableRow key={event.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{event.name}</p>
                              <p className="text-sm text-muted-foreground">{event.program}</p>
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
                            <StatusBadge status={event.certificateStatus} />
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{formatDate(event.updatedAt)}</p>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleEventClick(event)}>
                              <Eye className="h-4 w-4 mr-1" />
                              Ver detalles
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

        {/* Certificate Review Drawer */}
        <AdminCertificateDrawer
          event={selectedEvent}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false)
            setSelectedEvent(null)
          }}
          onMarkAsIssued={handleMarkAsIssued}
        />
      </div>
    </ProtectedRoute>
  )
}
