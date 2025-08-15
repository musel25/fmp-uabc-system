"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { StatusBadge } from "@/components/ui/status-badge"
import { Check, X, Calendar, MapPin, Users, FileText, DollarSign, Download } from "lucide-react"
import type { Event } from "@/lib/types"

interface AdminEventReviewDrawerProps {
  event: Event | null
  isOpen: boolean
  onClose: () => void
  onReview: (eventId: string, action: "approve" | "reject", comments?: string) => void
}

export function AdminEventReviewDrawer({ event, isOpen, onClose, onReview }: AdminEventReviewDrawerProps) {
  const [comments, setComments] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!event) return null

  const handleReview = async (action: "approve" | "reject") => {
    if (action === "reject" && !comments.trim()) {
      alert("Los comentarios son requeridos para rechazar un evento")
      return
    }

    setIsSubmitting(true)
    try {
      await onReview(event.id, action, comments.trim() || undefined)
      setComments("")
    } finally {
      setIsSubmitting(false)
    }
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

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <SheetTitle className="text-xl">{event.name}</SheetTitle>
              <SheetDescription>Revisión administrativa del evento</SheetDescription>
            </div>
            <StatusBadge status={event.status} />
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Event Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Información del Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Responsable</p>
                <p className="font-medium">{event.responsible}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{event.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                  <p>{event.phone}</p>
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

          {/* Event Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Fechas y Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de inicio</p>
                <p>{formatDate(event.startDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de fin</p>
                <p>{formatDate(event.endDate)}</p>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sede</p>
                  <p>{event.venue}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Information */}
          {event.hasCost && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5" />
                  Información de Costo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{event.costDetails}</p>
              </CardContent>
            </Card>
          )}

          {/* Online Information */}
          {(event.modality === "En línea" || event.modality === "Mixta") && event.onlineInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Información en Línea</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{event.onlineInfo}</p>
              </CardContent>
            </Card>
          )}

          {/* Organizers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Organizadores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{event.organizers}</p>
            </CardContent>
          </Card>

          {/* Observations */}
          {event.observations && (
            <Card>
              <CardHeader>
                <CardTitle>Observaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{event.observations}</p>
              </CardContent>
            </Card>
          )}

          {/* Files */}
          <Card>
            <CardHeader>
              <CardTitle>Archivos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Programa detallado</p>
                      <p className="text-sm text-muted-foreground">programa-evento.pdf</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Descargar
                  </Button>
                </div>

                {event.cvFiles.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">CVs de ponentes ({event.cvFiles.length})</p>
                    {event.cvFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">{file.type}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Descargar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Previous Comments */}
          {event.adminComments && (
            <Card>
              <CardHeader>
                <CardTitle>Comentarios Anteriores</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{event.adminComments}</p>
              </CardContent>
            </Card>
          )}

          {/* Review Section */}
          {event.status === "en_revision" && (
            <Card>
              <CardHeader>
                <CardTitle>Revisión Administrativa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="comments">Comentarios</Label>
                  <Textarea
                    id="comments"
                    placeholder="Agrega comentarios sobre la revisión (requerido para rechazar)"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="mt-1"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleReview("approve")}
                    disabled={isSubmitting}
                    className="btn-primary flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Aprobando..." : "Aprobar"}
                  </Button>
                  <Button
                    onClick={() => handleReview("reject")}
                    disabled={isSubmitting}
                    variant="destructive"
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Rechazando..." : "Rechazar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
