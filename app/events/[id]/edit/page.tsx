"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { EventWizard } from "@/components/events/event-wizard"
import { getEventById, resubmitEvent } from "@/lib/supabase-database"
import { getAuthUser } from "@/lib/supabase-auth"
import { useToast } from "@/hooks/use-toast"
import { eventToWizardValues } from "@/lib/event-form"
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

  const handleUpdateEvent = async (data: CreateEventData) => {
    if (!event) return

    try {
      await resubmitEvent(event.id, data)

      toast({
        title: "Evento enviado a revisión",
        description: "La coordinación revisará los cambios y responderá por correo.",
      })

      router.push(`/events/${event.id}`)
    } catch {
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

        <EventWizard onSubmit={handleUpdateEvent} initialData={eventToWizardValues(event)} />
      </AppShell>
    </ProtectedRoute>
  )
}
