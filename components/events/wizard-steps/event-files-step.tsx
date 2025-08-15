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
            <FormLabel>Programa detallado *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe el programa completo del evento: horarios, temas, ponentes, etc."
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
            <FormLabel>CVs de ponentes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe los CVs de los ponentes: nombres, títulos, experiencia relevante, etc."
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
          <li>• El programa detallado debe incluir horarios, temas y ponentes</li>
          <li>• Los CVs de ponentes deben incluir nombres, títulos y experiencia relevante</li>
          <li>• Proporciona toda la información de manera clara y organizada</li>
        </ul>
      </div>
    </div>
  )
}
