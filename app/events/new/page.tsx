"use client"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { Navbar } from "@/components/layout/navbar"
import { EventWizard } from "@/components/events/event-wizard"
import { createEvent, submitEventForReview } from "@/lib/supabase-database"
import { getAuthUser } from "@/lib/supabase-auth"
import { useToast } from "@/hooks/use-toast"
import type { CreateEventData } from "@/lib/types"

export default function NewEventPage() {
  const router = useRouter()
  const { toast } = useToast()

  const handleCreateEvent = async (data: CreateEventData, isDraft = false) => {
    try {
      // Get current authenticated user
      const user = await getAuthUser()
      if (!user) {
        router.push("/login")
        return
      }

      // Create event in database
      const newEvent = await createEvent(data, user.id)

      // If not a draft, submit for review
      let finalEvent = newEvent
      if (!isDraft) {
        finalEvent = await submitEventForReview(newEvent.id)
      }

      toast({
        title: isDraft ? "Borrador guardado" : "Evento enviado a revisión",
        description: isDraft
          ? "Tu evento se ha guardado"
          : "Tu evento ha sido enviado para revisión administrativa",
      })

      router.push(`/events/${finalEvent.id}`)
    } catch (error) {
      console.error('Create event error:', error)
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
