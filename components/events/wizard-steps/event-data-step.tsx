"use client"

import type { UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import type { CreateEventData } from "@/lib/types"

interface EventDataStepProps {
  form: UseFormReturn<CreateEventData>
}

export function EventDataStep({ form }: EventDataStepProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form
  const watchClassification = watch("classification")
  const watchHasCost = watch("hasCost")
  const watchModality = watch("modality")

  // Clear venue when modality changes to "En línea"
  const handleModalityChange = (value: string) => {
    setValue("modality", value as any)
    if (value === "En línea") {
      setValue("venue", "")
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="md:col-span-2">
        <Label htmlFor="name">Nombre de la actividad *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Ej. Conferencia de Neurociencias Aplicadas"
          className="mt-1"
        />
        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
      </div>


      <div>
        <Label htmlFor="phone">Teléfono *</Label>
        <Input id="phone" {...register("phone")} placeholder="664-123-4567" className="mt-1" />
        {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
      </div>

      <div>
        <Label htmlFor="program">Programa *</Label>
        <Select onValueChange={(value) => setValue("program", value as any)} defaultValue={watch("program")}>
          <SelectTrigger className="mt-1">
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
        <Select onValueChange={(value) => setValue("type", value as any)} defaultValue={watch("type")}>
          <SelectTrigger className="mt-1">
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
          onValueChange={(value) => setValue("classification", value as any)}
          defaultValue={watch("classification")}
        >
          <SelectTrigger className="mt-1">
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

      {watchClassification === "Otro" && (
        <div>
          <Label htmlFor="classificationOther">Especificar clasificación</Label>
          <Input
            id="classificationOther"
            {...register("classificationOther")}
            placeholder="Especifica la clasificación"
            className="mt-1"
          />
        </div>
      )}

      <div>
        <Label htmlFor="modality">Modalidad *</Label>
        <Select onValueChange={handleModalityChange} defaultValue={watch("modality")}>
          <SelectTrigger className="mt-1">
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
        <Label htmlFor="venue">
          Sede {watchModality !== "En línea" ? "*" : "(opcional)"}
        </Label>
        <Input 
          id="venue" 
          {...register("venue")} 
          placeholder={watchModality === "En línea" ? "No requerida para eventos en línea" : "Ej. Auditorio Principal FMP"}
          className="mt-1" 
          disabled={watchModality === "En línea"}
        />
        {errors.venue && <p className="text-sm text-destructive mt-1">{errors.venue.message}</p>}
      </div>

      <div>
        <Label htmlFor="startDate">Fecha y hora de inicio *</Label>
        <Input id="startDate" type="datetime-local" {...register("startDate")} className="mt-1" />
        {errors.startDate && <p className="text-sm text-destructive mt-1">{errors.startDate.message}</p>}
      </div>

      <div>
        <Label htmlFor="endDate">Fecha y hora de fin *</Label>
        <Input id="endDate" type="datetime-local" {...register("endDate")} className="mt-1" />
        {errors.endDate && <p className="text-sm text-destructive mt-1">{errors.endDate.message}</p>}
      </div>

      <div className="md:col-span-2">
        <div className="flex items-center space-x-2">
          <Checkbox id="hasCost" checked={watchHasCost} onCheckedChange={(checked) => setValue("hasCost", !!checked)} />
          <Label htmlFor="hasCost">¿El evento tiene costo?</Label>
        </div>
      </div>

      {watchHasCost && (
        <div className="md:col-span-2">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Atención:</strong> Contactar al responsable de educación continua
            </AlertDescription>
          </Alert>
        </div>
      )}

      {(watchModality === "En línea" || watchModality === "Mixta") && (
        <div className="md:col-span-2">
          <Label htmlFor="onlineInfo">Información en línea</Label>
          <Textarea
            id="onlineInfo"
            {...register("onlineInfo")}
            placeholder="Plataforma, enlace, instrucciones de acceso, etc."
            className="mt-1"
          />
        </div>
      )}

      <div className="md:col-span-2">
        <Label htmlFor="organizers">Organizadores (para constancias) *</Label>
        <Textarea
          id="organizers"
          {...register("organizers")}
          placeholder="Nombre Apellido; Nombre Apellido (separar con punto y coma)"
          className="mt-1"
        />
        {errors.organizers && <p className="text-sm text-destructive mt-1">{errors.organizers.message}</p>}
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="observations">Observaciones</Label>
        <Textarea
          id="observations"
          {...register("observations")}
          placeholder="Información adicional relevante"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="codigosRequeridos">¿Cuántos códigos 8 = 1 se requieren? *</Label>
        <Input
          id="codigosRequeridos"
          type="number"
          min="0"
          {...register("codigosRequeridos", { valueAsNumber: true })}
          placeholder="0"
          className="mt-1"
        />
        {errors.codigosRequeridos && <p className="text-sm text-destructive mt-1">{errors.codigosRequeridos.message}</p>}
      </div>
    </div>
  )
}
