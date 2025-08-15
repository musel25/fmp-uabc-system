"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Check, Clock, X, FileText, Award } from "lucide-react"
import type { Event } from "@/lib/types"

interface EventTimelineProps {
  event: Event
  className?: string
}

export function EventTimeline({ event, className = "" }: EventTimelineProps) {
  const steps = [
    {
      id: "borrador",
      title: "Borrador",
      description: "Evento creado",
      icon: FileText,
      status: "completed",
    },
    {
      id: "en_revision",
      title: "En revisión",
      description: "Revisión administrativa",
      icon: Clock,
      status: event.status === "borrador" ? "pending" : "completed",
    },
    {
      id: "decision",
      title: event.status === "aprobado" ? "Aprobado" : event.status === "rechazado" ? "Rechazado" : "Pendiente",
      description:
        event.status === "aprobado"
          ? "Evento autorizado"
          : event.status === "rechazado"
            ? "Evento rechazado"
            : "Esperando decisión",
      icon: event.status === "aprobado" ? Check : event.status === "rechazado" ? X : Clock,
      status:
        event.status === "aprobado" || event.status === "rechazado"
          ? "completed"
          : event.status === "en_revision"
            ? "current"
            : "pending",
    },
  ]

  // Add certificate steps if event is approved
  if (event.status === "aprobado") {
    steps.push({
      id: "constancias",
      title: "Constancias",
      description:
        event.certificateStatus === "sin_solicitar"
          ? "Sin solicitar"
          : event.certificateStatus === "solicitadas"
            ? "Solicitadas"
            : "Emitidas",
      icon: Award,
      status:
        event.certificateStatus === "emitidas"
          ? "completed"
          : event.certificateStatus === "solicitadas"
            ? "current"
            : "pending",
    })
  }

  return (
    <Card className={`card-uabc ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                    step.status === "completed"
                      ? step.id === "decision" && event.status === "rechazado"
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-primary text-primary-foreground"
                      : step.status === "current"
                        ? "bg-amber-500 text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`text-sm font-medium ${
                      step.status === "completed" || step.status === "current"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`hidden sm:block w-16 h-px mx-4 ${
                    step.status === "completed" ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Additional info for rejected events */}
        {event.status === "rechazado" && event.rejectionReason && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm font-medium text-destructive">Motivo del rechazo:</p>
            <p className="text-sm text-destructive/80 mt-1">{event.rejectionReason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
