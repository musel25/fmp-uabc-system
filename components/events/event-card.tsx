"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { AlarmClock, CalendarDays, Eye, MapPin, Pencil, ExternalLink } from "lucide-react"
import { nextStepFor, formatDateRange } from "@/lib/workflow"
import { semesterOf } from "@/lib/semester"
import type { Event } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * Tarjeta de evento del panel. Además del estado, dice qué le toca hacer a la
 * persona con este evento y cuándo vence — que es lo que la gente venía a
 * averiguar.
 */
export function EventCard({ event }: { event: Event }) {
  const next = nextStepFor(event)
  const semester = semesterOf(event.startDate)
  const primaryAction = next.actions[0]

  return (
    <article className="card-uabc group flex flex-col transition-shadow hover:shadow-[var(--shadow-md)]">
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-base leading-snug font-semibold text-balance text-ink">
            <Link href={`/events/${event.id}`} className="rounded-sm hover:underline">
              {event.name}
            </Link>
          </h3>
          <StatusBadge status={event.status} className="shrink-0" />
        </div>

        <dl className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Fechas</dt>
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
            <dd className="font-data text-xs">
              {formatDateRange(event.startDate, event.endDate)}
              {semester && (
                <span className="ml-2 rounded bg-surface-2 px-1.5 py-0.5 text-[0.6875rem] text-muted-foreground">
                  {semester}
                </span>
              )}
            </dd>
          </div>
          {event.venue && (
            <div className="flex items-center gap-2">
              <dt className="sr-only">Sede</dt>
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              <dd className="truncate">{event.venue}</dd>
            </div>
          )}
        </dl>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-md border border-border bg-surface-2/70 px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
            {event.program}
          </span>
          <span className="rounded-md border border-border bg-surface-2/70 px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
            {event.type}
          </span>
          <span className="rounded-md border border-border bg-surface-2/70 px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
            {event.modality}
          </span>
        </div>

        {/* Qué sigue, en una línea. El detalle completo vive en la página del evento. */}
        <p
          className={cn(
            "mt-4 flex items-start gap-1.5 text-xs text-pretty",
            next.tone === "urgent"
              ? "font-medium text-[var(--state-pending)]"
              : next.tone === "blocked"
                ? "font-medium text-[var(--state-rejected)]"
                : "text-muted-foreground",
          )}
        >
          {next.deadline && <AlarmClock className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
          <span>{next.deadline ?? next.title}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border p-3">
        <Button asChild size="sm" className="btn-primary flex-1">
          <Link href={`/events/${event.id}`}>
            <Eye className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Ver
          </Link>
        </Button>

        {event.status === "rechazado" && (
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link href={`/events/${event.id}/edit`}>
              <Pencil className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Editar
            </Link>
          </Button>
        )}

        {event.status === "aprobado" && primaryAction && (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => window.open(primaryAction.href, "_blank", "noopener,noreferrer")}
          >
            <span className="truncate">{primaryAction.label}</span>
            <ExternalLink className="ml-1.5 h-3 w-3 shrink-0" aria-hidden="true" />
          </Button>
        )}
      </div>
    </article>
  )
}
