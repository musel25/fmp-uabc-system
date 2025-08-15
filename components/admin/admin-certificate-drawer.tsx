"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { StatusBadge } from "@/components/ui/status-badge"
import { Award, Calendar, Users, FileText, Download, ImageIcon, MessageSquare } from "lucide-react"
import type { Event } from "@/lib/types"

interface AdminCertificateDrawerProps {
  event: Event | null
  isOpen: boolean
  onClose: () => void
  onMarkAsIssued: (eventId: string) => void
}

export function AdminCertificateDrawer({ event, isOpen, onClose, onMarkAsIssued }: AdminCertificateDrawerProps) {
  if (!event) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Mock certificate request data
  const certificateRequest = {
    attendanceList: "lista-asistencia-evento.pdf",
    photos: ["foto1.jpg", "foto2.jpg", "foto3.jpg"],
    summary:
      "El evento se desarrolló exitosamente con la participación de 45 asistentes. Se cubrieron todos los temas programados y se recibió retroalimentación muy positiva de los participantes. Los ponentes cumplieron con el programa establecido y se logró el objetivo de capacitación planteado.",
    speakers: [
      { name: "Dr. María González", role: "Ponente Principal" },
      { name: "Dr. Carlos Ruiz", role: "Moderador" },
    ],
    committee: [
      { name: "Lic. Ana Martínez", role: "Coordinadora" },
      { name: "Mtro. Luis Pérez", role: "Logística" },
    ],
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <SheetTitle className="text-xl">{event.name}</SheetTitle>
              <SheetDescription>Solicitud de constancias del evento</SheetDescription>
            </div>
            <StatusBadge status={event.certificateStatus} />
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Event Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Información del Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Responsable</p>
                <p>{event.responsible}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fechas</p>
                <p>
                  {formatDate(event.startDate)} - {formatDate(event.endDate)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sede</p>
                <p>{event.venue}</p>
              </div>
            </CardContent>
          </Card>

          {/* Certificate Request Evidence */}
          {event.certificateStatus !== "sin_solicitar" && (
            <>
              {/* Attendance List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    Lista de Asistencia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{certificateRequest.attendanceList}</p>
                        <p className="text-sm text-muted-foreground">Lista oficial de asistentes</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Descargar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Photos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ImageIcon className="h-5 w-5" />
                    Fotografías del Evento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {certificateRequest.photos.map((photo, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <ImageIcon className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{photo}</p>
                            <p className="text-sm text-muted-foreground">Fotografía {index + 1}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Event Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5" />
                    Reseña del Evento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{certificateRequest.summary}</p>
                  <div className="mt-3 text-xs text-muted-foreground">
                    {certificateRequest.summary.length}/250 palabras
                  </div>
                </CardContent>
              </Card>

              {/* Speakers and Committee */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Ponentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {certificateRequest.speakers.map((speaker, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{speaker.name}</p>
                            <p className="text-sm text-muted-foreground">{speaker.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Comité Organizador
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {certificateRequest.committee.map((member, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              {event.certificateStatus === "solicitadas" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Acciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Revisa toda la evidencia proporcionada y marca las constancias como emitidas cuando estén
                        listas.
                      </p>
                      <Button onClick={() => onMarkAsIssued(event.id)} className="btn-primary w-full">
                        <Award className="h-4 w-4 mr-2" />
                        Marcar como Emitidas
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {event.certificateStatus === "emitidas" && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Award className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Constancias Emitidas</h3>
                    <p className="text-muted-foreground">
                      Las constancias de este evento han sido marcadas como emitidas exitosamente.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
