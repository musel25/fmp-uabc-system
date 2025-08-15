"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { Navbar } from "@/components/layout/navbar"
import { EventWizard } from "@/components/events/event-wizard"
import { getEventById, updateEvent } from "@/lib/mock-events"
import { useToast } from "@/hooks/use-toast"
import type { Event, CreateEventData } from "@/lib/types"

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const eventId = params.id as string
    const foundEvent = getEventById(eventId)

    if (foundEvent) {
      // Check if user can edit this event
      if (foundEvent.status !== "borrador" && foundEvent.status !== "rechazado") {
        toast({
          title: "No se puede editar",
          description: "Solo puedes editar eventos en borrador o rechazados",
          variant: "destructive",
        })
        router.push(`/events/${eventId}`)
        return
      }
      setEvent(foundEvent)
    } else {
      toast({
        title: "Evento no encontrado",
        description: "El evento que buscas no existe o no tienes permisos para editarlo",
        variant: "destructive",
      })
      router.push("/dashboard")
    }
    setIsLoading(false)
  }, [params.id, router, toast])

  const handleUpdateEvent = async (data: CreateEventData, isDraft = false) => {
    if (!event) return

    try {
      const updatedEvent = updateEvent(event.id, {
        ...data,
        status: isDraft ? "borrador" : "en_revision",
      })

      if (updatedEvent) {
        toast({
          title: isDraft ? "Cambios guardados" : "Evento enviado a revisión",
          description: isDraft
            ? "Los cambios se han guardado como borrador"
            : "Tu evento ha sido enviado para revisión administrativa",
        })

        router.push(`/events/${event.id}`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
        variant: "destructive",
      })
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground-strong">Editar Evento</h1>
            <p className="text-muted-foreground mt-1">Modifica la información de tu evento</p>
          </div>

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
              startDate: event.startDate,
              endDate: event.endDate,
              hasCost: event.hasCost,
              costDetails: event.costDetails,
              onlineInfo: event.onlineInfo,
              organizers: event.organizers,
              observations: event.observations,
            }}
          />
        </main>
      </div>
    </ProtectedRoute>
  )
}
