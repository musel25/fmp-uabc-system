"use client"

import { useState } from "react"
import React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { StatusBadge } from "@/components/ui/status-badge"
import { Check, X, Calendar, MapPin, Users, FileText, DollarSign, Download } from "lucide-react"
import type { Event, EventFile } from "@/lib/types"
import { getEventFiles, createSignedUrl, formatFileSize, getFileIcon } from "@/lib/supabase-files"

interface AdminEventReviewDrawerProps {
  event: Event | null
  isOpen: boolean
  onClose: () => void
  onReview: (eventId: string, action: "approve" | "reject", comments?: string, rejectionReason?: string) => void
}

export function AdminEventReviewDrawer({ event, isOpen, onClose, onReview }: AdminEventReviewDrawerProps) {
  const [comments, setComments] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [eventFiles, setEventFiles] = useState<EventFile[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)

  // Load event files when event changes
  React.useEffect(() => {
    const loadEventFiles = async () => {
      if (!event?.id) return
      
      setLoadingFiles(true)
      try {
        const files = await getEventFiles(event.id)
        setEventFiles(files)
      } catch (error) {
        console.error('Error loading event files:', error)
      } finally {
        setLoadingFiles(false)
      }
    }

    loadEventFiles()
  }, [event?.id])

  if (!event) return null

  const handleReview = async (action: "approve" | "reject") => {
    if (action === "reject" && !rejectionReason.trim()) {
      alert("El motivo de rechazo es requerido")
      return
    }

    setIsSubmitting(true)
    try {
      await onReview(event.id, action, comments.trim() || undefined, rejectionReason.trim() || undefined)
      setComments("")
      setRejectionReason("")
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
              {loadingFiles ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Cargando archivos...</span>
                </div>
              ) : eventFiles.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No se han subido archivos para este evento</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {eventFiles.map((file) => {
                    const handleDownload = async () => {
                      try {
                        const signedUrl = await createSignedUrl(file.id)
                        if (signedUrl) {
                          window.open(signedUrl, '_blank')
                        }
                      } catch (error) {
                        console.error('Error downloading file:', error)
                      }
                    }

                    return (
                      <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getFileIcon(file.type)}</span>
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(file.size)} • {file.type}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleDownload}>
                          <Download className="h-4 w-4 mr-1" />
                          Descargar
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
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
                  <Label htmlFor="comments">Comentarios (opcional)</Label>
                  <Textarea
                    id="comments"
                    placeholder="Agrega comentarios adicionales sobre la revisión"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="rejectionReason">Motivo de rechazo</Label>
                  <Textarea
                    id="rejectionReason"
                    placeholder="Especifica el motivo del rechazo (requerido para rechazar)"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Este campo es requerido al rechazar un evento
                  </p>
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
