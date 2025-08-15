"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { EventTimeline } from "@/components/events/event-timeline"
import { CertificateRequestDialog } from "@/components/events/certificate-request-dialog"
import { Calendar, MapPin, Users, FileText, Download, Award, Edit, ArrowLeft } from "lucide-react"
import { getEventById, updateEvent } from "@/lib/mock-events"
import { useToast } from "@/hooks/use-toast"
import type { Event } from "@/lib/types"

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCertificateDialogOpen, setIsCertificateDialogOpen] = useState(false)

  useEffect(() => {
    const eventId = params.id as string
    const foundEvent = getEventById(eventId)

    if (foundEvent) {
      setEvent(foundEvent)
    } else {
      toast({
        title: "Evento no encontrado",
        description: "El evento que buscas no existe o no tienes permisos para verlo",
        variant: "destructive",
      })
      router.push("/dashboard")
    }
    setIsLoading(false)
  }, [params.id, router, toast])

  const handleDownloadTemplate = () => {
    toast({
      title: "Descargando plantilla",
      description: "La plantilla de difusión se está descargando...",
    })
    // Mock download functionality
  }

  const handleCertificateRequest = async (requestData: any) => {
    if (!event) return

    const updatedEvent = updateEvent(event.id, {
      certificateStatus: "solicitadas",
    })

    if (updatedEvent) {
      setEvent(updatedEvent)
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de constancias ha sido enviada para revisión",
      })
      setIsCertificateDialogOpen(false)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  if (!event) {
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const canEdit = event.status === "borrador" || event.status === "rechazado"
  const canDownloadTemplate = event.status === "aprobado"
  const canRequestCertificates = event.status === "aprobado" && event.certificateStatus === "sin_solicitar"

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground-strong">{event.name}</h1>
                  <p className="text-muted-foreground mt-1">Responsable: {event.responsible}</p>
                </div>
                <StatusBadge status={event.status} />
              </div>
            </div>
          </div>

          {/* Timeline */}
          <EventTimeline event={event} className="mb-8" />

          {/* Event Details */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card className="card-uabc">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Información del Evento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Fecha de inicio</p>
                        <p className="text-sm text-muted-foreground">{formatDate(event.startDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Fecha de fin</p>
                        <p className="text-sm text-muted-foreground">{formatDate(event.endDate)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Sede</p>
                      <p className="text-sm text-muted-foreground">{event.venue}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">{event.program}</Badge>
                    <Badge variant="outline">{event.type}</Badge>
                    <Badge variant="outline">{event.classification}</Badge>
                    <Badge variant="outline">{event.modality}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="card-uabc">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Información de Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{event.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Teléfono</p>
                    <p className="text-sm text-muted-foreground">{event.phone}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Information */}
              {event.hasCost && (
                <Card className="card-uabc">
                  <CardHeader>
                    <CardTitle>Información de Costo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{event.costDetails}</p>
                  </CardContent>
                </Card>
              )}

              {/* Online Information */}
              {(event.modality === "En línea" || event.modality === "Mixta") && event.onlineInfo && (
                <Card className="card-uabc">
                  <CardHeader>
                    <CardTitle>Información en Línea</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{event.onlineInfo}</p>
                  </CardContent>
                </Card>
              )}

              {/* Organizers */}
              <Card className="card-uabc">
                <CardHeader>
                  <CardTitle>Organizadores</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{event.organizers}</p>
                </CardContent>
              </Card>

              {/* Observations */}
              {event.observations && (
                <Card className="card-uabc">
                  <CardHeader>
                    <CardTitle>Observaciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{event.observations}</p>
                  </CardContent>
                </Card>
              )}

              {/* Admin Comments */}
              {event.adminComments && (
                <Card className="card-uabc">
                  <CardHeader>
                    <CardTitle>Comentarios Administrativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{event.adminComments}</p>
                  </CardContent>
                </Card>
              )}

              {/* Rejection Reason */}
              {event.status === "rechazado" && event.rejectionReason && (
                <Card className="card-uabc border-destructive">
                  <CardHeader>
                    <CardTitle className="text-destructive">Motivo de Rechazo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-destructive">{event.rejectionReason}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              <Card className="card-uabc">
                <CardHeader>
                  <CardTitle>Acciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {canEdit && (
                    <Button
                      onClick={() => router.push(`/events/${event.id}/edit`)}
                      variant="outline"
                      className="w-full"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar evento
                    </Button>
                  )}

                  {canDownloadTemplate && (
                    <Button onClick={handleDownloadTemplate} className="btn-primary w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar plantilla
                    </Button>
                  )}

                  {canRequestCertificates && (
                    <Button onClick={() => setIsCertificateDialogOpen(true)} className="btn-secondary w-full">
                      <Award className="h-4 w-4 mr-2" />
                      Solicitar constancias
                    </Button>
                  )}

                  {event.certificateStatus === "solicitadas" && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800 font-medium">Constancias solicitadas</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Tu solicitud está en revisión. Recibirás una notificación cuando estén listas.
                      </p>
                    </div>
                  )}

                  {event.certificateStatus === "emitidas" && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">Constancias emitidas</p>
                      <p className="text-xs text-green-700 mt-1">
                        Las constancias han sido generadas y están disponibles para descarga.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Files */}
              <Card className="card-uabc">
                <CardHeader>
                  <CardTitle>Archivos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Programa detallado</p>
                        <p className="text-xs text-muted-foreground">programa-evento.pdf</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>

                  {event.cvFiles.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">CVs de ponentes</p>
                      {event.cvFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg mb-2">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{file.type}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Event Stats */}
              <Card className="card-uabc">
                <CardHeader>
                  <CardTitle>Información del Estado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Creado</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.createdAt).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Última actualización</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.updatedAt).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Certificate Request Dialog */}
        <CertificateRequestDialog
          event={event}
          isOpen={isCertificateDialogOpen}
          onClose={() => setIsCertificateDialogOpen(false)}
          onSubmit={handleCertificateRequest}
        />
      </div>
    </ProtectedRoute>
  )
}
