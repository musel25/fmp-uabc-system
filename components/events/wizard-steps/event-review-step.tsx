"use client"

import { useState, useEffect } from "react"
import type { UseFormReturn } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, FileText, DollarSign } from "lucide-react"
import { getAuthUser } from "@/lib/supabase-auth"
import type { CreateEventData } from "@/lib/types"
import type { AuthUser } from "@/lib/supabase-auth"

interface EventReviewStepProps {
  form: UseFormReturn<CreateEventData & { isAuthorized: boolean }>
}

export function EventReviewStep({ form }: EventReviewStepProps) {
  const data = form.getValues()
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const fetchAuthUser = async () => {
      const user = await getAuthUser()
      setAuthUser(user)
    }
    fetchAuthUser()
  }, [])

  const formatDate = (dateString: string) => {
    if (!dateString) return "No especificada"
    return new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Tijuana",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString))
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-foreground-strong mb-2">Revisa la información de tu evento</h3>
        <p className="text-muted-foreground">Verifica que todos los datos sean correctos antes de enviar a revisión</p>
      </div>

      {/* Event Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Información del Evento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-lg">{data.name}</h4>
            <p className="text-muted-foreground">Responsable: {authUser?.name || 'Cargando...'}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Inicio</p>
                <p className="text-sm text-muted-foreground">{formatDate(data.startDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Fin</p>
                <p className="text-sm text-muted-foreground">{formatDate(data.endDate)}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Sede</p>
              <p className="text-sm text-muted-foreground">{data.venue}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Badge variant="outline">{data.program}</Badge>
            <Badge variant="outline">{data.type}</Badge>
            <Badge variant="outline">{data.classification}</Badge>
            <Badge variant="outline">{data.modality}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Información de Contacto
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium">Email</p>
            <p className="text-sm text-muted-foreground">{authUser?.email || 'Cargando...'}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Teléfono</p>
            <p className="text-sm text-muted-foreground">{data.phone}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Códigos 8 = 1 requeridos</p>
            <p className="text-sm text-muted-foreground">{data.codigosRequeridos}</p>
          </div>
        </CardContent>
      </Card>

      {/* Cost Information */}
      {data.hasCost && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Información de Costo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{data.costDetails}</p>
          </CardContent>
        </Card>
      )}

      {/* Online Information */}
      {(data.modality === "En línea" || data.modality === "Mixta") && data.onlineInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Información en Línea</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{data.onlineInfo}</p>
          </CardContent>
        </Card>
      )}

      {/* Organizers */}
      <Card>
        <CardHeader>
          <CardTitle>Organizadores</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{data.organizers}</p>
        </CardContent>
      </Card>

      {/* Observations */}
      {data.observations && (
        <Card>
          <CardHeader>
            <CardTitle>Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{data.observations}</p>
          </CardContent>
        </Card>
      )}

      {/* Program Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Descripción del evento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm text-muted-foreground">
            {data.programDetails || "No se proporcionó descripción del evento"}
          </div>
        </CardContent>
      </Card>

      {/* Speaker CVs */}
      {data.speakerCvs && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Semblanza curricular de ponentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm text-muted-foreground">
              {data.speakerCvs}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Important Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-medium text-amber-800 mb-2">Importante</h4>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• Una vez enviado a revisión, no podrás editar el evento hasta recibir una respuesta</li>
          <li>• El proceso de revisión puede tomar de 3 a 5 días hábiles</li>
          <li>• Recibirás una notificación por correo sobre el estado de tu solicitud, favor de checar spam</li>
          <li>• Después de recibir la aprobación, deberán entrar nuevamente para reservar el espacio y descargar la plantilla de difusión</li>
          <li>• Deberán recabar la lista de asistentes y tomar fotografías del evento, y subirlas desde el botón de generar constancias</li>
        </ul>
      </div>
    </div>
  )
}
