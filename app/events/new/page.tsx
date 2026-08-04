"use client"

import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { EventWizard } from "@/components/events/event-wizard"
import { ProcessGuideDialog } from "@/components/workflow/process-guide"
import { HelpCircle } from "lucide-react"
import { createEvent, submitEventForReview } from "@/lib/supabase-database"
import { getAuthUser } from "@/lib/supabase-auth"
import { useToast } from "@/hooks/use-toast"
import type { CreateEventData } from "@/lib/types"

export default function NewEventPage() {
  const router = useRouter()
  const { toast } = useToast()

  const handleCreateEvent = async (data: CreateEventData) => {
    try {
      const user = await getAuthUser()
      if (!user) {
        router.push("/login")
        return
      }

      const newEvent = await createEvent(
        { ...data, responsible: user.name, email: user.email },
        user.id,
      )
      const submitted = await submitEventForReview(newEvent.id)

      toast({
        title: "Evento enviado a revisión",
        description: "La coordinación responderá por correo en 3 a 5 días hábiles.",
      })

      router.push(`/events/${submitted.id}`)
    } catch (error) {
      console.error("Create event error:", error)
      toast({
        title: "No se pudo registrar el evento",
        description: "Revisa los datos y vuelve a intentarlo.",
        variant: "destructive",
      })
    }
  }

  return (
    <ProtectedRoute>
      <AppShell width="narrow">
        <PageHeader
          eyebrow="Etapa 02 de la ruta del evento"
          title="Registrar evento"
          description="Captura la actividad para enviarla a revisión. Necesitas la autorización previa de dirección o subdirección y al menos tres semanas de anticipación."
          actions={
            <ProcessGuideDialog
              activePhaseId="registro"
              trigger={
                <Button variant="outline">
                  <HelpCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                  Guía del proceso
                </Button>
              }
            />
          }
        />

        <EventWizard onSubmit={handleCreateEvent} />
      </AppShell>
    </ProtectedRoute>
  )
}
