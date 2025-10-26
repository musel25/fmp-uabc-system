"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { Navbar } from "@/components/layout/navbar"
import { EventWizard } from "@/components/events/event-wizard"
import { getEventById, updateEvent, submitEventForReview } from "@/lib/supabase-database"
import { getAuthUser } from "@/lib/supabase-auth"
import { useToast } from "@/hooks/use-toast"
import type { Event, CreateEventData } from "@/lib/types"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setIsLoading(true)
        const eventId = params.id as string
        
        // Check authentication first
        const user = await getAuthUser()
        if (!user) {
          router.push("/login")
          return
        }

        // Load event from database
        const foundEvent = await getEventById(eventId)

        if (foundEvent) {
          // Check if user owns this event
          if (foundEvent.userId !== user.id) {
            toast({
              title: "Acceso denegado",
              description: "No tienes permisos para editar este evento",
              variant: "destructive",
            })
            router.push("/dashboard")
            return
          }

          // Check if user can edit this event (status-wise)
          if (foundEvent.status !== "rechazado") {
            toast({
              title: "No se puede editar",
              description: "Solo puedes editar eventos rechazados",
              variant: "destructive",
            })
            router.push(`/events/${eventId}`)
            return
          }
          
          setEvent(foundEvent)
        } else {
          toast({
            title: "Evento no encontrado",
            description: "El evento que buscas no existe",
            variant: "destructive",
          })
          router.push("/dashboard")
        }
      } catch (error) {
        console.error('Load event error:', error)
        toast({
          title: "Error",
          description: "No se pudo cargar el evento",
          variant: "destructive",
        })
        router.push("/dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    loadEvent()
  }, [params.id, router, toast])

  // Convierte una ISO (UTC) a 'YYYY-MM-DDTHH:mm' en zona America/Tijuana
  const isoUTCToLocalTijuana = (iso?: string) => {
    if (!iso) return ''
    const date = new Date(iso)
    const tz = 'America/Tijuana'
    const fmt = new Intl.DateTimeFormat('en-CA', { // en-CA gives YYYY-MM-DD
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
    })
    const fmtTime = new Intl.DateTimeFormat('en-GB', { // en-GB gives HH:mm
      timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit'
    })
    const dateStr = fmt.format(date) // YYYY-MM-DD
    const timeStr = fmtTime.format(date) // HH:mm
    return `${dateStr}T${timeStr}`
  }

  const handleUpdateEvent = async (data: CreateEventData, isDraft = false) => {
    if (!event) return

    try {
      // Update event with new data
      let updatedEvent = await updateEvent(event.id, data)
      
      // If not a draft, also submit for review
      if (!isDraft) {
        updatedEvent = await submitEventForReview(event.id)
      }

      toast({
        title: isDraft ? "Cambios guardados" : "Evento enviado a revisión",
        description: isDraft
          ? "Los cambios se han guardado"
          : "Tu evento ha sido enviado para revisión administrativa",
      })

      router.push(`/events/${event.id}`)
    } catch (error) {
      console.error('Update event error:', error)
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
        <div className="min-h-screen bg-background flex flex-col">
          <Header />
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
              startDate: isoUTCToLocalTijuana(event.startDate),
              endDate: isoUTCToLocalTijuana(event.endDate),
              hasCost: event.hasCost,
              costDetails: event.costDetails,
              onlineInfo: event.onlineInfo,
              organizers: event.organizers,
              observations: event.observations,
            }}
          />
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
