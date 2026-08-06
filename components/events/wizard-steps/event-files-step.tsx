"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import type { UseFormReturn } from "react-hook-form"
import type { EventWizardValues } from "@/lib/event-extras"
import { MAX_WORDS_LONG_FIELD } from "@/lib/workflow"
import { cn } from "@/lib/utils"

interface EventFilesStepProps {
  form: UseFormReturn<EventWizardValues>
}

function countWords(text?: string): number {
  const trimmed = text?.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

/** Contador visible: el límite de 300 palabras estaba escrito pero no se veía. */
function WordCount({ text }: { text?: string }) {
  const words = countWords(text)
  const over = words > MAX_WORDS_LONG_FIELD

  return (
    <p
      className={cn(
        "font-data mt-1.5 text-right text-xs",
        over ? "font-medium text-[var(--state-pending)]" : "text-muted-foreground",
      )}
      aria-live="polite"
    >
      {words} / {MAX_WORDS_LONG_FIELD} palabras
      {over && " — excede el máximo"}
    </p>
  )
}

export function EventFilesStep({ form }: EventFilesStepProps) {
  const programDetails = form.watch("programDetails")
  const speakerCvs = form.watch("speakerCvs")

  return (
    <div className="space-y-8">
      <FormField
        control={form.control}
        name="programDetails"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción del evento *</FormLabel>
            <p className="text-xs text-muted-foreground">
              Programa completo: horarios, temas y ponentes. Máximo{" "}
              {MAX_WORDS_LONG_FIELD} palabras.
            </p>
            <FormControl>
              <Textarea
                placeholder="Describe el programa del evento: horarios, temas, ponentes, dinámica de las sesiones…"
                className="mt-2 min-h-[280px] resize-y leading-7"
                {...field}
              />
            </FormControl>
            <WordCount text={programDetails} />
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="speakerCvs"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Semblanza curricular de ponentes *</FormLabel>
            <p className="text-xs text-muted-foreground">
              Nombres, títulos y experiencia relevante de cada ponente. Máximo{" "}
              {MAX_WORDS_LONG_FIELD} palabras.
            </p>
            <FormControl>
              <Textarea
                placeholder="Nombre y grado de cada ponente, adscripción y experiencia relacionada con el tema…"
                className="mt-2 min-h-[200px] resize-y leading-7"
                {...field}
              />
            </FormControl>
            <WordCount text={speakerCvs} />
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="rounded-lg border border-border bg-surface-2/50 p-4">
        <h3 className="font-display text-sm font-semibold text-ink">
          Estos textos se usan tal cual
        </h3>
        <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span
              className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--uabc-ocre)]"
              aria-hidden="true"
            />
            La descripción es lo que revisa la coordinación para autorizar el evento.
          </li>
          <li className="flex gap-2">
            <span
              className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--uabc-ocre)]"
              aria-hidden="true"
            />
            La semblanza respalda el perfil de quienes participan como ponentes.
          </li>
        </ul>
      </div>
    </div>
  )
}
