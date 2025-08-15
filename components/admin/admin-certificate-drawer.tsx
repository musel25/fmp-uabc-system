"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { StatusBadge } from "@/components/ui/status-badge"
import { Award, Calendar, Users, FileText, MessageSquare } from "lucide-react"
import type { Event } from "@/lib/types"

interface AdminCertificateDrawerProps {
  request: any | null
  isOpen: boolean
  onClose: () => void
  onApproveCertificates: (requestId: string) => void
}

export function AdminCertificateDrawer({ request, isOpen, onClose, onApproveCertificates }: AdminCertificateDrawerProps) {
  if (!request) return null

  const event = request.events

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Certificate request data from database
  const certificateData = {
    summary: request.event_summary || "Información del evento no disponible",
    speakers: request.speakers || [],
    committee: request.committee || [],
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
              {/* Program Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    Programa del Evento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm">
                    {event.programDetails || "No se proporcionó programa detallado"}
                  </div>
                </CardContent>
              </Card>

              {/* Speaker CVs */}
              {event.speakerCvs && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5" />
                      CVs de Ponentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap text-sm">
                      {event.speakerCvs}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Event Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5" />
                    Reseña del Evento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{certificateData.summary}</p>
                  <div className="mt-3 text-xs text-muted-foreground">
                    {certificateData.summary.length} caracteres
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
                    {certificateData.speakers.length > 0 ? (
                      <div className="space-y-3">
                        {certificateData.speakers.map((speaker, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{speaker.name || `Ponente ${index + 1}`}</p>
                              <p className="text-sm text-muted-foreground">{speaker.role || 'Ponente'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No se especificaron ponentes</p>
                    )}
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
                    {certificateData.committee.length > 0 ? (
                      <div className="space-y-3">
                        {certificateData.committee.map((member, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{member.name || `Miembro ${index + 1}`}</p>
                              <p className="text-sm text-muted-foreground">{member.role || 'Comité'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No se especificó comité organizador</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Participant List */}
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Participantes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground mb-4">
                      Total de participantes: {Array.isArray(request.participant_list) ? request.participant_list.length : 0}
                    </p>
                    {Array.isArray(request.participant_list) && request.participant_list.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {request.participant_list.map((participant: any, index: number) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <p className="font-medium">{participant.name || `Participante ${index + 1}`}</p>
                            {participant.email && (
                              <p className="text-sm text-muted-foreground">{participant.email}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No se proporcionó lista de participantes</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              {request.status === "pending" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Acciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Revisa la información proporcionada y aprueba las constancias para marcarlas como emitidas.
                      </p>
                      <Button onClick={() => onApproveCertificates(request.id)} className="btn-primary w-full">
                        <Award className="h-4 w-4 mr-2" />
                        Aprobar y Marcar como Emitidas
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {request.status === "approved" && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Award className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Constancias Aprobadas</h3>
                    <p className="text-muted-foreground">
                      Las constancias de este evento han sido aprobadas y marcadas como emitidas.
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
