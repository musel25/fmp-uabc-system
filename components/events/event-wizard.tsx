"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Form } from "@/components/ui/form"
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { EventDataStep } from "./wizard-steps/event-data-step"
import { EventFilesStep } from "./wizard-steps/event-files-step"
import { EventReviewStep } from "./wizard-steps/event-review-step"
import type { CreateEventData } from "@/lib/types"
import { MIN_LEAD_DAYS } from "@/lib/workflow"
import { wizardValuesToCreateData, type EventWizardValues } from "@/lib/event-form"
import { tijuanaLocalToUTC } from "@/lib/timezone"
import { cn } from "@/lib/utils"

/**
 * Three-step registration wizard: event data → long descriptions → review.
 * Collects an `EventWizardValues`, converts it to `CreateEventData` on submit
 * (dates normalized from Tijuana wall time to UTC) and hands it to `onSubmit`,
 * which decides whether that means creating or resubmitting.
 */

const eventSchema = z
  .object({
    name: z.string().min(1, "El nombre del evento es requerido"),
    responsible: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().min(1, "El teléfono es requerido"),
    program: z.enum(["Médico", "Psicología", "Nutrición", "Posgrado", "Otro"]),
    type: z.enum(["Académico", "Cultural", "Deportivo", "Salud"]),
    classification: z.enum(["Conferencia", "Seminario", "Taller", "Otro"]),
    classificationOther: z.string().optional(),
    modality: z.enum(["Presencial", "En línea", "Mixta"]),
    venue: z.string(),
    startDate: z.string().min(1, "La fecha de inicio es requerida"),
    endDate: z.string().min(1, "La fecha de fin es requerida"),
    hasCost: z.boolean(),
    onlineInfo: z.string().optional(),
    organizers: z.string().min(1, "Los organizadores son requeridos"),
    observations: z.string().optional(),
    programDetails: z.string().min(1, "La descripción del evento es requerida"),
    speakerCvs: z.string().min(1, "La semblanza curricular de ponentes es requerida"),
    codigosRequeridos: z.number().min(0, "El número debe ser mayor o igual a 0"),
    // Preguntas de opción: "" significa "sin contestar" y no pasa la validación
    isAuthorized: z
      .enum(["", "si", "no"])
      .refine((v) => v !== "", "Indica si el evento ya fue autorizado"),
    userType: z
      .enum(["", "interno", "externo"])
      .refine((v) => v !== "", "Indica si eres usuario interno o externo a UABC"),
    seaesCategories: z.array(z.string()),
  })
  .refine(
    // La sede sólo se omite en eventos totalmente en línea
    (data) => data.modality === "En línea" || data.venue.trim() !== "",
    {
      message: "La sede es requerida para eventos presenciales y mixtos",
      path: ["venue"],
    },
  )
  .refine(
    (data) => {
      const diffMs = new Date(data.startDate).getTime() - Date.now()
      return diffMs >= MIN_LEAD_DAYS * 24 * 60 * 60 * 1000
    },
    {
      message: `Reagendar: no se cumple con el tiempo requerido (mínimo ${MIN_LEAD_DAYS} días de anticipación)`,
      path: ["startDate"],
    },
  )

interface EventWizardProps {
  onSubmit: (data: CreateEventData) => void
  /** Prefill for the edit/resubmit flow (see eventToWizardValues). */
  initialData?: Partial<EventWizardValues>
}

export function EventWizard({ onSubmit, initialData }: EventWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<EventWizardValues>({
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
      isAuthorized: "",
      userType: "",
      seaesCategories: [],
      ...initialData,
    },
  })

  const steps = [
    { number: 1, title: "Datos del evento", description: "Fechas, sede y clasificación" },
    { number: 2, title: "Programa y ponentes", description: "Descripción y semblanzas" },
    { number: 3, title: "Revisión", description: "Confirmar y enviar" },
  ]

  /* Por qué no se puede avanzar todavía. Antes el botón sólo se apagaba. */
  const blockedReason = (() => {
    if (currentStep !== 1) return null
    if (!form.watch("isAuthorized"))
      return "Indica si dirección o subdirección ya autorizó este evento."
    if (!form.watch("userType")) return "Indica si eres usuario interno o externo a UABC."
    if (form.watch("hasCost"))
      return "Los eventos con costo se gestionan con el responsable de educación continua antes de registrarse aquí."
    const startDate = form.watch("startDate")
    if (!startDate) return "Indica la fecha y hora de inicio."
    const diffMs = new Date(startDate).getTime() - Date.now()
    if (diffMs < MIN_LEAD_DAYS * 24 * 60 * 60 * 1000)
      return `La fecha de inicio debe estar al menos ${MIN_LEAD_DAYS} días después de hoy.`
    return null
  })()

  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await form.trigger([
        "name",
        "phone",
        "program",
        "type",
        "classification",
        "modality",
        "venue",
        "startDate",
        "endDate",
        "organizers",
        "codigosRequeridos",
        "isAuthorized",
        "userType",
      ])
      if (isValid && !blockedReason) setCurrentStep(2)
    } else if (currentStep === 2) {
      const isValid = await form.trigger(["programDetails", "speakerCvs"])
      if (isValid) setCurrentStep(3)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const values = form.getValues()
      const data = wizardValuesToCreateData({
        ...values,
        startDate: tijuanaLocalToUTC(values.startDate),
        endDate: tijuanaLocalToUTC(values.endDate),
      })
      await onSubmit(data)
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
      {/* Avance del registro */}
      <div className="card-uabc p-5">
        <ol className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-2">
          {steps.map((step, index) => {
            const done = step.number < currentStep
            const active = step.number === currentStep
            return (
              <li key={step.number} className="flex flex-1 items-start gap-3">
                <span
                  className={cn(
                    "font-data flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    active
                      ? "border-transparent bg-primary text-primary-foreground"
                      : done
                        ? "border-[var(--state-approved-line)] bg-[var(--state-approved-bg)] text-[var(--state-approved)]"
                        : "border-border bg-card text-muted-foreground",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {done ? <Check className="h-4 w-4" aria-hidden="true" /> : step.number}
                </span>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      active ? "text-ink" : done ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <span className="mt-4 hidden h-px flex-1 bg-border sm:block" aria-hidden="true" />
                )}
              </li>
            )
          })}
        </ol>
        <Progress value={(currentStep / steps.length) * 100} className="mt-5 h-1.5" />
      </div>

      {/* Contenido del paso */}
      <div className="card-uabc p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-ink">
          {steps[currentStep - 1].title}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {steps[currentStep - 1].description}
        </p>
        <div className="mt-6">
          <Form {...form}>
            <form className="space-y-6">{renderStep()}</form>
          </Form>
        </div>
      </div>

      {blockedReason && (
        <p className="rounded-md border border-[var(--state-pending-line)] bg-[var(--state-pending-bg)] px-3 py-2 text-sm text-[var(--state-pending)]">
          {blockedReason}
        </p>
      )}

      {/* Navegación */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleExit}>
            <X className="mr-2 h-4 w-4" aria-hidden="true" />
            Salir
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Anterior
          </Button>
        </div>

        <div className="flex gap-2">
          {currentStep < steps.length ? (
            <Button
              type="button"
              onClick={handleNext}
              className="btn-primary"
              disabled={Boolean(blockedReason)}
            >
              Siguiente
              <ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? "Enviando…" : "Enviar a revisión"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
