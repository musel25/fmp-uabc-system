"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink, AlarmClock, Route } from "lucide-react"
import { WORKFLOW_PHASES, type WorkflowPhase } from "@/lib/workflow"
import { cn } from "@/lib/utils"

/**
 * "Ruta del evento" — el trámite completo, numerado.
 *
 * La numeración aquí no es decorativa: el proceso es una secuencia real con
 * dos plazos duros (21 días antes de iniciar, 21 días después de terminar), y
 * el orden es justamente lo que la gente pierde de vista.
 */

function PhaseCard({
  phase,
  active,
}: {
  phase: WorkflowPhase
  active?: boolean
}) {
  return (
    <li className="relative pl-12 sm:pl-14">
      {/* Marcador numerado sobre el riel. */}
      <span
        className={cn(
          "font-data absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold sm:h-10 sm:w-10 sm:text-sm",
          active
            ? "border-transparent bg-primary text-primary-foreground shadow-sm"
            : "border-border bg-card text-muted-foreground",
        )}
        aria-hidden="true"
      >
        {phase.step}
      </span>

      <div className={cn("pb-8", active && "rounded-lg")}>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="font-display text-base font-semibold text-ink">{phase.title}</h3>
          <span className="font-data rounded-full bg-surface-2 px-2 py-0.5 text-[0.6875rem] text-muted-foreground">
            {phase.when}
          </span>
          {active && (
            <span className="chip chip-revision">Estás aquí</span>
          )}
        </div>

        <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{phase.summary}</p>

        <ul className="mt-3 space-y-2">
          {phase.tasks.map((task, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-foreground">
              <span
                className="mt-[0.5rem] h-1 w-1 shrink-0 rounded-full bg-[var(--uabc-ocre)]"
                aria-hidden="true"
              />
              <span className="text-pretty">
                {task.text}
                {task.link && (
                  <>
                    {" "}
                    <a
                      href={task.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-2 hover:text-[var(--green-700)]"
                    >
                      {task.link.label}
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>

        {phase.deadline && (
          <p className="mt-3 inline-flex items-start gap-2 rounded-md border border-[var(--state-pending-line)] bg-[var(--state-pending-bg)] px-3 py-2 text-xs text-[var(--state-pending)]">
            <AlarmClock className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-semibold">Plazo:</span> {phase.deadline}
            </span>
          </p>
        )}
      </div>
    </li>
  )
}

export function ProcessGuide({ activePhaseId }: { activePhaseId?: string }) {
  return (
    <ol className="relative">
      {/* El riel que conecta las seis etapas. */}
      <span
        className="absolute left-[1.125rem] top-3 bottom-3 w-px bg-border sm:left-5"
        aria-hidden="true"
      />
      {WORKFLOW_PHASES.map((phase) => (
        <PhaseCard key={phase.id} phase={phase} active={phase.id === activePhaseId} />
      ))}
    </ol>
  )
}

/**
 * Tira compacta con las seis etapas — el mapa del trámite, siempre visible.
 * Al activarla se abre la guía completa.
 */
export function ProcessRail({
  activePhaseId,
  className,
}: {
  activePhaseId?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn("card-uabc overflow-hidden", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="font-display text-sm font-semibold text-ink">Ruta del evento</h2>
        </div>
        <ProcessGuideDialog
          open={open}
          onOpenChange={setOpen}
          activePhaseId={activePhaseId}
          trigger={
            <Button variant="outline" size="sm">
              Ver guía completa
            </Button>
          }
        />
      </div>

      <ol className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {WORKFLOW_PHASES.map((phase) => {
          const active = phase.id === activePhaseId
          return (
            <li
              key={phase.id}
              className={cn(
                "flex flex-col gap-1 bg-card px-4 py-3",
                active && "bg-[var(--green-50)]",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "font-data text-xs font-semibold",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {phase.step}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    active ? "text-[var(--green-700)]" : "text-foreground",
                  )}
                >
                  {phase.title}
                </span>
              </div>
              <span className="font-data text-[0.6875rem] text-muted-foreground">
                {phase.when}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function ProcessGuideDialog({
  trigger,
  activePhaseId,
  open,
  onOpenChange,
}: {
  trigger: React.ReactNode
  activePhaseId?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] gap-0 overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="mb-6 text-left">
          <DialogTitle className="font-display text-xl">Ruta del evento</DialogTitle>
          <DialogDescription>
            Las seis etapas del trámite, del permiso interno a la entrega de constancias.
          </DialogDescription>
        </DialogHeader>
        <ProcessGuide activePhaseId={activePhaseId} />
      </DialogContent>
    </Dialog>
  )
}
