"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { EventWizard } from "@/components/events/event-wizard"
import { getEventById, updateEvent, submitEventForReview } from "@/lib/supabase-database"
import { getAuthUser } from "@/lib/supabase-auth"
import { useToast } from "@/hooks/use-toast"
import type { Event, CreateEventData } from "@/lib/types"

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadEvent = async () => {
      try {
        setIsLoading(true)
        const eventId = params.id as string

        const user = await getAuthUser()
        if (!user) {
          router.push("/login")
          return
        }

        const found = await getEventById(eventId)
        if (!mounted) return

        if (!found) {
          toast({
            title: "Ese evento no existe",
            description: "Es posible que se haya eliminado o que el enlace esté mal.",
            variant: "destructive",
          })
          router.push("/dashboard")
          return
        }

        if (found.userId !== user.id) {
          toast({
            title: "No puedes editar este evento",
            description: "Sólo la persona que lo registró puede modificarlo.",
            variant: "destructive",
          })
          router.push("/dashboard")
          return
        }

        if (found.status !== "rechazado") {
          toast({
            title: "Este evento no se puede editar",
            description: "Sólo se editan los eventos que la coordinación devolvió con cambios.",
            variant: "destructive",
          })
          router.push(`/events/${eventId}`)
          return
        }

        setEvent(found)
      } catch (error) {
        console.error("Load event error:", error)
        if (!mounted) return
        toast({
          title: "No se pudo cargar el evento",
          description: "Revisa tu conexión y vuelve a intentarlo.",
          variant: "destructive",
        })
        router.push("/dashboard")
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    loadEvent()
    return () => {
      mounted = false
    }
  }, [params.id, router, toast])

  /** ISO (UTC) → 'YYYY-MM-DDTHH:mm' en zona America/Tijuana, para los inputs. */
  const isoUTCToLocalTijuana = (iso?: string) => {
    if (!iso) return ""
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return ""
    const tz = "America/Tijuana"
    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date)
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
    return `${day}T${time}`
  }

  const handleUpdateEvent = async (data: CreateEventData) => {
    if (!event) return

    try {
      await updateEvent(event.id, data)
      await submitEventForReview(event.id)

      toast({
        title: "Evento enviado a revisión",
        description: "La coordinación revisará los cambios y responderá por correo.",
      })

      router.push(`/events/${event.id}`)
    } catch (error) {
      console.error("Update event error:", error)
      toast({
        title: "No se pudieron guardar los cambios",
        description: "Revisa los datos y vuelve a intentarlo.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppShell width="narrow">
          <div className="animate-pulse space-y-6">
            <div className="h-9 w-1/3 rounded bg-muted" />
            <div className="h-24 rounded bg-muted" />
            <div className="h-72 rounded bg-muted" />
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  if (!event) return null

  return (
    <ProtectedRoute>
      <AppShell width="narrow">
        <PageHeader
          eyebrow="Evento devuelto con cambios"
          title="Editar evento"
          description={
            event.rejectionReason
              ? `Motivo del rechazo: ${event.rejectionReason}`
              : "Corrige la información y vuelve a enviarla a revisión."
          }
        />

        <EventWizard
          onSubmit={handleUpdateEvent}
          initialData={{
            name: event.name,
            responsible: event.responsible,
            email: event.email,
            phone: event.phone,
            program: event.program,
            type: event.type,
            classification: event.classification,
            classificationOther: event.classificationOther,
            modality: event.modality,
            venue: event.venue,
            startDate: isoUTCToLocalTijuana(event.startDate),
            endDate: isoUTCToLocalTijuana(event.endDate),
            hasCost: event.hasCost,
            costDetails: event.costDetails,
            onlineInfo: event.onlineInfo,
            organizers: event.organizers,
            observations: event.observations,
            // Faltaban: sin estos, editar un evento borraba su descripción.
            programDetails: event.programDetails,
            speakerCvs: event.speakerCvs,
            codigosRequeridos: event.codigosRequeridos,
            // Ya tenía la autorización cuando se registró la primera vez.
            // (Si las observaciones traen la respuesta guardada, esa gana.)
            isAuthorized: "si",
          }}
        />
      </AppShell>
    </ProtectedRoute>
  )
}
