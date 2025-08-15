"use client"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { Navbar } from "@/components/layout/navbar"
import { EventWizard } from "@/components/events/event-wizard"
import { createEvent } from "@/lib/mock-events"
import { useToast } from "@/hooks/use-toast"
import type { CreateEventData } from "@/lib/types"

export default function NewEventPage() {
  const router = useRouter()
  const { toast } = useToast()

  const handleCreateEvent = async (data: CreateEventData, isDraft = false) => {
    try {
      // Get current user
      const userData = localStorage.getItem("fmp-user")
      if (!userData) {
        router.push("/login")
        return
      }

      const user = JSON.parse(userData)

      // Create event with user ID
      const eventData = {
        ...data,
        userId: user.id,
        status: isDraft ? "borrador" : "en_revision",
      }

      const newEvent = createEvent(eventData)

      toast({
        title: isDraft ? "Borrador guardado" : "Evento enviado a revisión",
        description: isDraft
          ? "Tu evento se ha guardado como borrador"
          : "Tu evento ha sido enviado para revisión administrativa",
      })

      router.push(`/events/${newEvent.id}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el evento. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground-strong">Crear Evento</h1>
            <p className="text-muted-foreground mt-1">Completa la información para registrar tu evento</p>
          </div>

          <EventWizard onSubmit={handleCreateEvent} />
        </main>
      </div>
    </ProtectedRoute>
  )
}
