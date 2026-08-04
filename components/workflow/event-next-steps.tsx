"use client"

import { Button } from "@/components/ui/button"
import { AlarmClock, ArrowRight, CheckCircle2, ExternalLink, Info, TriangleAlert } from "lucide-react"
import { nextStepFor, type EventNextStep, type NextStepTone } from "@/lib/workflow"
import type { Event } from "@/lib/types"
import { cn } from "@/lib/utils"

const TONE: Record<
  NextStepTone,
  { box: string; icon: typeof Info; iconClass: string; title: string }
> = {
  info: {
    box: "border-[var(--state-info-line)] bg-[var(--state-info-bg)]",
    icon: Info,
    iconClass: "text-[var(--state-info)]",
    title: "text-[var(--state-info)]",
  },
  action: {
    box: "border-[var(--state-approved-line)] bg-[var(--state-approved-bg)]",
    icon: ArrowRight,
    iconClass: "text-[var(--state-approved)]",
    title: "text-[var(--state-approved)]",
  },
  urgent: {
    box: "border-[var(--state-pending-line)] bg-[var(--state-pending-bg)]",
    icon: AlarmClock,
    iconClass: "text-[var(--state-pending)]",
    title: "text-[var(--state-pending)]",
  },
  blocked: {
    box: "border-[var(--state-rejected-line)] bg-[var(--state-rejected-bg)]",
    icon: TriangleAlert,
    iconClass: "text-[var(--state-rejected)]",
    title: "text-[var(--state-rejected)]",
  },
  done: {
    box: "border-[var(--state-approved-line)] bg-[var(--state-approved-bg)]",
    icon: CheckCircle2,
    iconClass: "text-[var(--state-approved)]",
    title: "text-[var(--state-approved)]",
  },
}

/**
 * Qué le toca hacer a la persona con ESTE evento, ahora. Sustituye al bloque
 * de botones sueltos que sólo decía "aprobado" sin decir qué sigue.
 */
export function EventNextSteps({
  event,
  className,
  step,
}: {
  event: Event
  className?: string
  /** Permite reutilizar un paso ya calculado y evitar recalcularlo. */
  step?: EventNextStep
}) {
  const next = step ?? nextStepFor(event)
  const tone = TONE[next.tone]
  const Icon = tone.icon

  return (
    <section className={cn("rounded-lg border p-4", tone.box, className)}>
      <div className="flex gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", tone.iconClass)} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-current opacity-70">Qué sigue</p>
          <h2 className={cn("mt-1 font-display text-base font-semibold", tone.title)}>
            {next.title}
          </h2>
          <p className="mt-1.5 text-sm text-pretty text-foreground/90">{next.detail}</p>

          {next.deadline && (
            <p
              className={cn(
                "font-data mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium",
                tone.title,
              )}
            >
              <AlarmClock className="h-3.5 w-3.5" aria-hidden="true" />
              {next.deadline}
            </p>
          )}

          {next.actions.length > 0 && (
            <div className="no-print mt-4 flex flex-wrap gap-2">
              {next.actions.map((action, i) => (
                <Button
                  key={action.href}
                  size="sm"
                  variant={i === 0 ? "default" : "outline"}
                  className={i === 0 ? "btn-primary" : "bg-card"}
                  onClick={() => window.open(action.href, "_blank", "noopener,noreferrer")}
                >
                  {action.label}
                  <ExternalLink className="ml-1.5 h-3 w-3" aria-hidden="true" />
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
