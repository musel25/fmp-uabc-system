"use client"

import type React from "react"
import type { UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Info, TriangleAlert } from "lucide-react"
import type { CreateEventData } from "@/lib/types"
import { MIN_LEAD_DAYS } from "@/lib/workflow"
import {
  EXTERNAL_USER_COSTS,
  EXTERNAL_USER_NOTE_STEPS,
  SEAES_CATEGORIES,
  type EventWizardValues,
} from "@/lib/event-form"

interface EventDataStepProps {
  form: UseFormReturn<EventWizardValues>
}

export function EventDataStep({ form }: EventDataStepProps) {
  const {
    register,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = form

  const classification = watch("classification")
  const hasCost = watch("hasCost")
  const modality = watch("modality")
  const isAuthorized = watch("isAuthorized")
  const userType = watch("userType")
  const seaesCategories = watch("seaesCategories") ?? []
  const startDate = watch("startDate")

  const toggleSeaesCategory = (category: string, checked: boolean) => {
    const current = getValues("seaesCategories") ?? []
    setValue(
      "seaesCategories",
      checked ? [...current, category] : current.filter((c) => c !== category),
    )
  }

  const pad = (n: number) => String(n).padStart(2, "0")
  const formatLocalForInput = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

  const earliestStart = new Date()
  earliestStart.setDate(earliestStart.getDate() + MIN_LEAD_DAYS)
  const minStartDateStr = formatLocalForInput(earliestStart)

  const belowMinLead = startDate
    ? new Date(startDate).getTime() - Date.now() < MIN_LEAD_DAYS * 24 * 60 * 60 * 1000
    : false

  const handleModalityChange = (value: string) => {
    setValue("modality", value as CreateEventData["modality"])
    if (value === "En línea") setValue("venue", "")
  }

  const isOnline = modality === "En línea"

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-border bg-surface-2/50 p-4">
        <p className="text-sm font-medium">
          ¿Dirección o subdirección ya autorizó este evento?
        </p>
        <RadioGroup
          value={isAuthorized || undefined}
          onValueChange={(v) =>
            setValue("isAuthorized", v as EventWizardValues["isAuthorized"], {
              shouldValidate: true,
            })
          }
          className="mt-3 flex flex-wrap gap-x-8 gap-y-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="si" id="isAuthorized-si" />
            <Label htmlFor="isAuthorized-si" className="font-normal">
              Sí
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="isAuthorized-no" />
            <Label htmlFor="isAuthorized-no" className="font-normal">
              No
            </Label>
          </div>
        </RadioGroup>
        <FieldError message={errors.isAuthorized?.message} />
      </section>

      <Fieldset legend="Identificación">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Nombre de la actividad *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Ej. Conferencia de Neurociencias Aplicadas"
            className="mt-1"
          />
          <FieldError message={errors.name?.message} />
        </div>

        <div className="sm:col-span-2">
          <Label>¿Es usuario interno o externo a UABC? *</Label>
          <RadioGroup
            value={userType || undefined}
            onValueChange={(v) =>
              setValue("userType", v as EventWizardValues["userType"], {
                shouldValidate: true,
              })
            }
            className="mt-2 flex flex-wrap gap-x-8 gap-y-2"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="interno" id="userType-interno" />
              <Label htmlFor="userType-interno" className="font-normal">
                Sí, soy usuario interno
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="externo" id="userType-externo" />
              <Label htmlFor="userType-externo" className="font-normal">
                No, soy usuario externo
              </Label>
            </div>
          </RadioGroup>
          <FieldError message={errors.userType?.message} />

          {userType === "externo" && (
            <div className="mt-3 rounded-lg border border-[var(--state-info-line)] bg-[var(--state-info-bg)] p-4">
              <h4 className="flex items-center gap-2 font-display text-sm font-semibold text-[var(--state-info)]">
                <Info className="h-4 w-4" aria-hidden="true" />
                Costos para usuarios externos
              </h4>
              <ul className="mt-2.5 space-y-1.5">
                {EXTERNAL_USER_COSTS.map(({ space, cost }) => (
                  <li
                    key={space}
                    className="flex items-baseline justify-between gap-3 text-sm text-foreground/90"
                  >
                    <span>{space}</span>
                    <span className="font-data text-xs font-semibold">{cost}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 border-t border-[var(--state-info-line)] pt-3 text-sm text-foreground/90">
                <p className="font-medium">
                  Nota: si su evento es autorizado (revisar SPAM):
                </p>
                <ol className="mt-1.5 list-decimal space-y-1 pl-5">
                  {EXTERNAL_USER_NOTE_STEPS.map((step) => (
                    <li key={step} className="text-pretty">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Teléfono de contacto *</Label>
          <Input id="phone" {...register("phone")} placeholder="664-123-4567" className="mt-1" />
          <FieldError message={errors.phone?.message} />
        </div>

        <div>
          <Label htmlFor="codigosRequeridos">Códigos 8 = 1 requeridos *</Label>
          <Input
            id="codigosRequeridos"
            type="number"
            min="0"
            {...register("codigosRequeridos", { valueAsNumber: true })}
            placeholder="0"
            className="mt-1"
          />
          <FieldError message={errors.codigosRequeridos?.message} />
        </div>
      </Fieldset>

      <Fieldset legend="Clasificación">
        <div>
          <Label htmlFor="program">Programa *</Label>
          <Select value={watch("program")} onValueChange={(v) => setValue("program", v as never)}>
            <SelectTrigger id="program" className="mt-1">
              <SelectValue placeholder="Selecciona un programa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Médico">Médico</SelectItem>
              <SelectItem value="Psicología">Psicología</SelectItem>
              <SelectItem value="Nutrición">Nutrición</SelectItem>
              <SelectItem value="Posgrado">Posgrado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="type">Tipo *</Label>
          <Select value={watch("type")} onValueChange={(v) => setValue("type", v as never)}>
            <SelectTrigger id="type" className="mt-1">
              <SelectValue placeholder="Selecciona un tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Académico">Académico</SelectItem>
              <SelectItem value="Cultural">Cultural</SelectItem>
              <SelectItem value="Deportivo">Deportivo</SelectItem>
              <SelectItem value="Salud">Salud</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="classification">Clasificación *</Label>
          <Select
            value={watch("classification")}
            onValueChange={(v) => setValue("classification", v as never)}
          >
            <SelectTrigger id="classification" className="mt-1">
              <SelectValue placeholder="Selecciona una clasificación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Conferencia">Conferencia</SelectItem>
              <SelectItem value="Seminario">Seminario</SelectItem>
              <SelectItem value="Taller">Taller</SelectItem>
              <SelectItem value="Otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {classification === "Otro" && (
          <div>
            <Label htmlFor="classificationOther">¿Cuál?</Label>
            <Input
              id="classificationOther"
              {...register("classificationOther")}
              placeholder="Especifica la clasificación"
              className="mt-1"
            />
          </div>
        )}

        <div className="sm:col-span-2">
          <Label>Categorías SEAES</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Este evento se enmarca dentro de (puedes seleccionar más de una):
          </p>
          <div className="mt-2.5 grid gap-x-4 gap-y-2 sm:grid-cols-2">
            {SEAES_CATEGORIES.map((category) => {
              const id = `seaes-${category.replace(/\s+/g, "-").toLowerCase()}`
              return (
                <div key={category} className="flex items-start gap-2">
                  <Checkbox
                    id={id}
                    checked={seaesCategories.includes(category)}
                    onCheckedChange={(checked) => toggleSeaesCategory(category, !!checked)}
                    className="mt-0.5"
                  />
                  <Label htmlFor={id} className="text-sm font-normal leading-5">
                    {category}
                  </Label>
                </div>
              )
            })}
          </div>
        </div>
      </Fieldset>

      <Fieldset legend="Cuándo y dónde">
        <div>
          <Label htmlFor="startDate">Fecha y hora de inicio *</Label>
          <Input
            id="startDate"
            type="datetime-local"
            min={minStartDateStr}
            {...register("startDate")}
            className="mt-1"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Se requieren al menos {MIN_LEAD_DAYS} días de anticipación.
          </p>
          <FieldError message={errors.startDate?.message} />
          {!errors.startDate && belowMinLead && (
            <p className="mt-1 text-sm text-destructive">
              Reagenda: no se cumplen los {MIN_LEAD_DAYS} días de anticipación.
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="endDate">Fecha y hora de fin *</Label>
          <Input id="endDate" type="datetime-local" {...register("endDate")} className="mt-1" />
          <FieldError message={errors.endDate?.message} />
        </div>

        <div>
          <Label htmlFor="modality">Modalidad *</Label>
          <Select value={modality} onValueChange={handleModalityChange}>
            <SelectTrigger id="modality" className="mt-1">
              <SelectValue placeholder="Selecciona una modalidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Presencial">Presencial</SelectItem>
              <SelectItem value="En línea">En línea</SelectItem>
              <SelectItem value="Mixta">Mixta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="venue">Sede {isOnline ? "(no aplica)" : "*"}</Label>
          <Input
            id="venue"
            {...register("venue")}
            placeholder={isOnline ? "No se requiere en eventos en línea" : "Ej. Auditorio Principal FMP"}
            className="mt-1"
            disabled={isOnline}
          />
          <FieldError message={errors.venue?.message} />
        </div>

        {(modality === "En línea" || modality === "Mixta") && (
          <div className="sm:col-span-2">
            <Label htmlFor="onlineInfo">Acceso en línea</Label>
            <Textarea
              id="onlineInfo"
              {...register("onlineInfo")}
              placeholder="Plataforma, enlace e instrucciones de acceso"
              className="mt-1 min-h-[90px]"
            />
          </div>
        )}
      </Fieldset>

      <Fieldset legend="Organización">
        <div className="sm:col-span-2">
          <Label htmlFor="organizers">Organizadores *</Label>
          <p className="text-xs text-muted-foreground">
            Tal como deben aparecer en las constancias, separados por punto y coma.
          </p>
          <Textarea
            id="organizers"
            {...register("organizers")}
            placeholder="Nombre Apellido; Nombre Apellido"
            className="mt-1.5 min-h-[90px]"
          />
          <FieldError message={errors.organizers?.message} />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="observations">Observaciones</Label>
          <Textarea
            id="observations"
            {...register("observations")}
            placeholder="Cualquier información adicional relevante para la revisión"
            className="mt-1 min-h-[80px]"
          />
        </div>

        <div className="sm:col-span-2">
          <div className="flex items-start gap-3">
            <Checkbox
              id="hasCost"
              checked={hasCost}
              onCheckedChange={(checked) => setValue("hasCost", !!checked)}
              className="mt-0.5"
            />
            <Label htmlFor="hasCost" className="text-sm font-medium">
              El evento tiene costo para quienes asisten
            </Label>
          </div>

          {hasCost && (
            <Notice tone="pending" className="mt-3">
              Los eventos con costo se gestionan con el responsable de educación continua. Contáctalo
              antes de continuar con el registro.
            </Notice>
          )}
        </div>
      </Fieldset>
    </div>
  )
}

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="eyebrow mb-3 border-b border-border pb-2 w-full">{legend}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-sm text-destructive">{message}</p>
}

function Notice({
  tone,
  children,
  className,
}: {
  tone: "pending" | "rejected"
  children: React.ReactNode
  className?: string
}) {
  const colors =
    tone === "pending"
      ? "border-[var(--state-pending-line)] bg-[var(--state-pending-bg)] text-[var(--state-pending)]"
      : "border-[var(--state-rejected-line)] bg-[var(--state-rejected-bg)] text-[var(--state-rejected)]"

  return (
    <p className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${colors} ${className ?? ""}`}>
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="text-pretty">{children}</span>
    </p>
  )
}
