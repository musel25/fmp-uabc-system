"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Form } from "@/components/ui/form"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { EventDataStep } from "./wizard-steps/event-data-step"
import { EventFilesStep } from "./wizard-steps/event-files-step"
import { EventReviewStep } from "./wizard-steps/event-review-step"
import type { CreateEventData } from "@/lib/types"

const eventSchema = z.object({
  name: z.string().min(1, "El nombre del evento es requerido"),
  responsible: z.string().min(1, "El responsable es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "El teléfono es requerido"),
  program: z.enum(["Médico", "Psicología", "Nutrición", "Posgrado"]),
  type: z.enum(["Académico", "Cultural", "Deportivo", "Salud"]),
  classification: z.enum(["Conferencia", "Seminario", "Taller", "Otro"]),
  classificationOther: z.string().optional(),
  modality: z.enum(["Presencial", "En línea", "Mixta"]),
  venue: z.string().min(1, "La sede es requerida"),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  endDate: z.string().min(1, "La fecha de fin es requerida"),
  hasCost: z.boolean(),
  costDetails: z.string().optional(),
  onlineInfo: z.string().optional(),
  organizers: z.string().min(1, "Los organizadores son requeridos"),
  observations: z.string().optional(),
  programDetails: z.string().min(1, "El programa detallado es requerido"),
  speakerCvs: z.string().optional(),
})

interface EventWizardProps {
  onSubmit: (data: CreateEventData, isDraft?: boolean) => void
  initialData?: Partial<CreateEventData>
}

export function EventWizard({ onSubmit, initialData }: EventWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateEventData>({
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
      ...initialData,
    },
  })

  const steps = [
    { number: 1, title: "Datos del Evento", description: "Información básica" },
    { number: 2, title: "Programa y Ponentes", description: "Detalles del evento" },
    { number: 3, title: "Revisión", description: "Confirmar información" },
  ]

  const handleNext = async () => {
    // For step 1, validate basic event fields
    if (currentStep === 1) {
      const fieldsToValidate: (keyof CreateEventData)[] = [
        'name', 'responsible', 'email', 'phone', 'program', 
        'type', 'classification', 'modality', 'venue', 
        'startDate', 'endDate', 'organizers'
      ]
      
      const isValid = await form.trigger(fieldsToValidate)
      console.log('Step 1 validation:', isValid, 'Errors:', form.formState.errors)
      
      if (isValid) {
        setCurrentStep(2)
      }
    }
    // For step 2, validate program details
    else if (currentStep === 2) {
      const isValid = await form.trigger(['programDetails'])
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
      const data = form.getValues()
      await onSubmit(data, isDraft)
    } finally {
      setIsSubmitting(false)
    }
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
        <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>

        <div className="flex gap-2">
          {currentStep === 3 && (
            <Button type="button" variant="outline" onClick={() => handleSubmit(true)} disabled={isSubmitting}>
              Guardar
            </Button>
          )}

          {currentStep < 3 ? (
            <Button type="button" onClick={handleNext} className="btn-primary">
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
