"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Form } from "@/components/ui/form"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { EventDataStep } from "./wizard-steps/event-data-step"
import { EventFilesStep } from "./wizard-steps/event-files-step"
import { EventReviewStep } from "./wizard-steps/event-review-step"
import type { CreateEventData } from "@/lib/types"

const MIN_LEAD_DAYS = 21

const eventSchema = z.object({
  name: z.string().min(1, "El nombre del evento es requerido"),
  responsible: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().min(1, "El teléfono es requerido"),
  program: z.enum(["Médico", "Psicología", "Nutrición", "Posgrado"]),
  type: z.enum(["Académico", "Cultural", "Deportivo", "Salud"]),
  classification: z.enum(["Conferencia", "Seminario", "Taller", "Otro"]),
  classificationOther: z.string().optional(),
  modality: z.enum(["Presencial", "En línea", "Mixta"]),
  venue: z.string(),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  endDate: z.string().min(1, "La fecha de fin es requerida"),
  hasCost: z.boolean(),
  costDetails: z.string().optional(),
  onlineInfo: z.string().optional(),
  organizers: z.string().min(1, "Los organizadores son requeridos"),
  observations: z.string().optional(),
  programDetails: z.string().min(1, "La descripción del evento es requerida"),
  speakerCvs: z.string().min(1, "La semblanza curricular de ponentes es requerida"),
  codigosRequeridos: z.number().min(0, "El número debe ser mayor o igual a 0"),
  // Campo de control solo para el flujo del formulario (no se guarda en DB)
  isAuthorized: z.boolean(),
}).refine((data) => {
  // Venue is required only if modality is not "En línea"
  if (data.modality !== "En línea" && (!data.venue || data.venue.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "La sede es requerida para eventos presenciales y mixtos",
  path: ["venue"]
}).refine((data) => {
  // Validar anticipación mínima de 21 días para la fecha de inicio
  const start = new Date(data.startDate)
  const now = new Date()
  const diffMs = start.getTime() - now.getTime()
  const minMs = MIN_LEAD_DAYS * 24 * 60 * 60 * 1000
  return diffMs >= minMs
}, {
  message: "Reagendar: no se cumple con el tiempo requerido (mínimo 21 días de anticipación)",
  path: ["startDate"]
})

interface EventWizardProps {
  onSubmit: (data: CreateEventData, isDraft?: boolean) => void
  initialData?: Partial<CreateEventData>
}

export function EventWizard({ onSubmit, initialData }: EventWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // Ampliamos el tipo del formulario para incluir el campo de autorización
  const form = useForm<CreateEventData & { isAuthorized: boolean }>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      responsible: "",
      email: "",
      phone: "",
      program: "Médico",
      type: "Académico",
      classification: "Conferencia",
      modality: "Presencial",
      venue: "",
      startDate: "",
      endDate: "",
      hasCost: false,
      organizers: "",
      programDetails: "",
      speakerCvs: "",
      codigosRequeridos: 0,
      isAuthorized: false,
      ...initialData,
    },
  })

  // Convierte una cadena 'YYYY-MM-DDTHH:mm' asumida en zona 'America/Tijuana' a ISO UTC
  const localTijuanaToUTC = (local: string) => {
    if (!local) return local
    // Parse components
    const [datePart, timePart] = local.split('T')
    if (!datePart || !timePart) return local
    const [y, m, d] = datePart.split('-').map(Number)
    const [hh, mm] = timePart.split(':').map(Number)
    // Create a date representing that wall time in UTC first
    const utcGuess = new Date(Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0))
    // Compute TZ offset for America/Tijuana at that instant
    const tz = 'America/Tijuana'
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
    const parts = dtf.formatToParts(utcGuess)
    const map: any = {}
    for (const p of parts) map[p.type] = p.value
    const asUTC = Date.UTC(+map.year, +map.month - 1, +map.day, +map.hour, +map.minute, +map.second)
    // Offset in minutes between formatted TZ time and the UTC guess
    const offsetMinutes = (asUTC - utcGuess.getTime()) / 60000
    const utcMillis = Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0) - offsetMinutes * 60000
    return new Date(utcMillis).toISOString()
  }

  const steps = [
    { number: 1, title: "Datos del Evento", description: "Información básica" },
    { number: 2, title: "Programa y Ponentes", description: "Detalles del evento" },
    { number: 3, title: "Revisión", description: "Confirmar información" },
  ]

  const handleNext = async () => {
    // For step 1, validate basic event fields
    if (currentStep === 1) {
      const fieldsToValidate: (keyof CreateEventData)[] = [
        'name', 'phone', 'program', 
        'type', 'classification', 'modality', 'venue', 
        'startDate', 'endDate', 'organizers', 'codigosRequeridos'
      ]
      
      const isValid = await form.trigger(fieldsToValidate)
      console.log('Step 1 validation:', isValid, 'Errors:', form.formState.errors)
      
      // Verificar autorización y detener navegación si NO está autorizado
      const isAuthorized = form.watch('isAuthorized')
      if (!isAuthorized) {
        return // No continuar si no está autorizado
      }

      // Check if event has cost and prevent navigation
      const hasCost = form.watch('hasCost')
      if (hasCost) {
        return // Don't proceed to next step if event has cost
      }
      
      if (isValid) {
        setCurrentStep(2)
      }
    }
    // For step 2, validate program details
    else if (currentStep === 2) {
      const isValid = await form.trigger(['programDetails', 'speakerCvs'])
      console.log('Step 2 validation:', isValid, 'Errors:', form.formState.errors)
      
      if (isValid) {
        setCurrentStep(3)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (isDraft = false) => {
    setIsSubmitting(true)
    try {
      const raw = form.getValues()
      // Normalizar fechas a UTC asumiendo horario de Tijuana
      const data: CreateEventData = {
        ...raw,
        startDate: localTijuanaToUTC(raw.startDate),
        endDate: localTijuanaToUTC(raw.endDate),
      }
      await onSubmit(data, isDraft)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExit = () => {
    router.push("/dashboard")
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <EventDataStep form={form} />
      case 2:
        return <EventFilesStep form={form} />
      case 3:
        return <EventReviewStep form={form} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Stepper */}
      <Card className="card-uabc">
        <CardHeader>
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    step.number <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.number}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p
                    className={`text-sm font-medium ${step.number <= currentStep ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && <div className="hidden sm:block w-16 h-px bg-border mx-4" />}
              </div>
            ))}
          </div>
          <Progress value={(currentStep / 3) * 100} className="mt-4" />
        </CardHeader>
      </Card>

      {/* Step Content */}
      <Card className="card-uabc">
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6">{renderStep()}</form>
          </Form>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleExit}>
            <X className="h-4 w-4 mr-2" />
            Salir
          </Button>
          <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
        </div>

        <div className="flex gap-2">
          {currentStep === 3 && (
            <Button type="button" variant="outline" onClick={() => handleSubmit(true)} disabled={isSubmitting}>
              Guardar
            </Button>
          )}

          {currentStep < 3 ? (
            <Button 
              type="button" 
              onClick={handleNext} 
              className="btn-primary"
              disabled={currentStep === 1 && (
                form.watch('hasCost') ||
                !form.watch('isAuthorized') ||
                (() => {
                  const sd = form.watch('startDate')
                  if (!sd) return true
                  const start = new Date(sd)
                  const now = new Date()
                  const diffMs = start.getTime() - now.getTime()
                  return diffMs < MIN_LEAD_DAYS * 24 * 60 * 60 * 1000
                })()
              )}
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button type="button" onClick={() => handleSubmit(false)} disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? "Enviando..." : "Enviar a revisión"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
