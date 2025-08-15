"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import type { UseFormReturn } from "react-hook-form"
import type { CreateEventData } from "@/lib/types"

interface EventFilesStepProps {
  form: UseFormReturn<CreateEventData>
}

export function EventFilesStep({ form }: EventFilesStepProps) {


  return (
    <div className="space-y-6">
      {/* Program Details */}
      <FormField
        control={form.control}
        name="programDetails"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción del evento (máx. 300 palabras) *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe el programa completo del evento: horarios, temas, ponentes, etc. (máximo 300 palabras)"
                className="min-h-[120px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Speaker CVs */}
      <FormField
        control={form.control}
        name="speakerCvs"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Semblanza curricular de ponentes (máx. 300 palabras)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe la semblanza curricular de los ponentes: nombres, títulos, experiencia relevante, etc. (máximo 300 palabras)"
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Help Text */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Información requerida</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• La descripción del evento debe incluir horarios, temas y ponentes (máx. 300 palabras)</li>
          <li>• La semblanza curricular debe incluir nombres, títulos y experiencia relevante (máx. 300 palabras)</li>
          <li>• Proporciona toda la información de manera clara y organizada</li>
        </ul>
      </div>
    </div>
  )
}
