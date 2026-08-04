"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { EventNextSteps } from "@/components/workflow/event-next-steps"
import { ProcessRail } from "@/components/workflow/process-guide"
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  FileSpreadsheet,
  Pencil,
  Printer,
  Upload,
} from "lucide-react"
import { getEventById } from "@/lib/supabase-database"
import { getAuthUser } from "@/lib/supabase-auth"
import { useToast } from "@/hooks/use-toast"
import {
  EVIDENCE_ACTION_LABEL,
  WORKFLOW_LINKS,
  evidenceDeadline,
  formatDateTime,
  formatLongDate,
  nextStepFor,
} from "@/lib/workflow"
import { semesterOf } from "@/lib/semester"
import { COORDINATION_EMAIL } from "@/components/layout/header"
import type { Event } from "@/lib/types"

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadEvent = async () => {
      try {
        setIsLoading(true)
        const eventId = params.id as string

        const user = await getAuthUser()
        if (!user) {
          router.push("/login")
          return
        }

        const found = await getEventById(eventId)
        if (!mounted) return

        if (!found) {
          toast({
            title: "Ese evento no existe",
            description: "Es posible que se haya eliminado o que el enlace esté mal.",
            variant: "destructive",
          })
          router.push("/dashboard")
          return
        }

        if (found.userId !== user.id && user.role !== "admin") {
          toast({
            title: "No puedes ver este evento",
            description: "Sólo la persona que lo registró y la coordinación tienen acceso.",
            variant: "destructive",
          })
          router.push("/dashboard")
          return
        }

        setEvent(found)
      } catch (err) {
        console.error("Load event error:", err)
        if (!mounted) return
        toast({
          title: "No se pudo cargar el evento",
          description: "Revisa tu conexión y vuelve a intentarlo.",
          variant: "destructive",
        })
        router.push("/dashboard")
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    loadEvent()
    return () => {
      mounted = false
    }
  }, [params.id, router, toast])

  const next = useMemo(() => (event ? nextStepFor(event) : null), [event])
  const deadline = useMemo(() => (event ? evidenceDeadline(event) : null), [event])

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppShell width="wide">
          <div className="animate-pulse space-y-6">
            <div className="h-9 w-1/3 rounded bg-muted" />
            <div className="h-24 rounded bg-muted" />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="h-72 rounded bg-muted lg:col-span-2" />
              <div className="h-72 rounded bg-muted" />
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  if (!event) return null

  const canEdit = event.status === "rechazado"
  const semester = semesterOf(event.startDate)

  return (
    <ProtectedRoute>
      <AppShell width="wide">
        {/* Encabezado de la versión impresa. */}
        <div className="print-only mb-6 border-b border-black/20 pb-3">
          <p className="text-[9pt] uppercase tracking-widest">
            UABC · Facultad de Medicina y Psicología
          </p>
          <p className="text-[11pt] font-semibold">
            Extensión de la cultura y divulgación de la ciencia
          </p>
          <p className="text-[9pt]">Registro de evento · {COORDINATION_EMAIL}</p>
        </div>

        <Button asChild variant="ghost" size="sm" className="no-print -ml-2 mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Mis eventos
          </Link>
        </Button>

        <header className="mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={event.status} />
              {semester && (
                <span className="font-data rounded-md border border-border bg-surface-2/70 px-2 py-0.5 text-[0.6875rem] text-muted-foreground">
                  Ciclo {semester}
                </span>
              )}
            </div>
            <h1 className="font-display text-2xl font-semibold text-balance text-ink sm:text-3xl">
              {event.name}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Responsable: {event.responsible || "No especificado"}
            </p>
          </div>

          <div className="no-print flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
              Imprimir
            </Button>
            {canEdit && (
              <Button asChild className="btn-primary">
                <Link href={`/events/${event.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                  Editar evento
                </Link>
              </Button>
            )}
          </div>
        </header>

        {next && <EventNextSteps event={event} step={next} className="mb-6" />}

        <ProcessRail activePhaseId={next?.phaseId} className="no-print mb-6" />

        <div className="print-flow grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="card-uabc p-5">
              <h2 className="font-display text-base font-semibold text-ink">Datos del evento</h2>
              <dl className="mt-3">
                <Field label="Inicio">
                  <span className="font-data text-xs">{formatDateTime(event.startDate)}</span>
                </Field>
                <Field label="Fin">
                  <span className="font-data text-xs">{formatDateTime(event.endDate)}</span>
                </Field>
                <Field label="Modalidad">{event.modality}</Field>
                <Field label="Sede">
                  {event.venue || "No aplica para eventos en línea"}
                </Field>
                <Field label="Programa">{event.program}</Field>
                <Field label="Tipo">{event.type}</Field>
                <Field label="Clasificación">
                  {event.classification === "Otro" && event.classificationOther
                    ? `Otro — ${event.classificationOther}`
                    : event.classification}
                </Field>
                <Field label="Códigos 8 = 1">
                  <span className="font-data text-xs">{event.codigosRequeridos}</span>
                </Field>
                <Field label="Costo">
                  {event.hasCost
                    ? event.costDetails || "Con costo — contactar a educación continua"
                    : "Sin costo"}
                </Field>
                {(event.modality === "En línea" || event.modality === "Mixta") &&
                  event.onlineInfo && (
                    <Field label="Acceso en línea">
                      <span className="whitespace-pre-wrap">{event.onlineInfo}</span>
                    </Field>
                  )}
              </dl>
            </section>

            {/* Texto largo: aquí es donde la descripción necesitaba aire. */}
            <LongText
              title="Descripción del evento"
              body={event.programDetails}
              empty="No se capturó la descripción del evento."
            />

            <LongText
              title="Semblanza curricular de ponentes"
              body={event.speakerCvs}
              empty="No se capturó la semblanza de los ponentes."
            />

            <LongText
              title="Organizadores"
              caption="Nombres tal como aparecerán en las constancias."
              body={event.organizers}
              empty="No se capturaron organizadores."
            />

            {event.observations && (
              <LongText title="Observaciones" body={event.observations} empty="" />
            )}

            {event.status === "rechazado" && event.rejectionReason && (
              <section className="rounded-lg border border-[var(--state-rejected-line)] bg-[var(--state-rejected-bg)] p-5">
                <h2 className="font-display text-base font-semibold text-[var(--state-rejected)]">
                  Motivo del rechazo
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-[0.9375rem] leading-7 text-pretty text-foreground">
                  {event.rejectionReason}
                </p>
              </section>
            )}

            {event.adminComments && (
              <section className="rounded-lg border border-[var(--state-info-line)] bg-[var(--state-info-bg)] p-5">
                <h2 className="font-display text-base font-semibold text-[var(--state-info)]">
                  Comentarios de la coordinación
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-[0.9375rem] leading-7 text-pretty text-foreground">
                  {event.adminComments}
                </p>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            {event.status === "aprobado" && (
              <section className="card-uabc no-print p-5">
                <h2 className="font-display text-base font-semibold text-ink">Trámites</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Formularios institucionales. Se abren en una pestaña nueva.
                </p>
                <div className="mt-4 space-y-2">
                  <LinkButton
                    href={WORKFLOW_LINKS.reservarEspacio}
                    icon={<Building2 className="h-4 w-4" aria-hidden="true" />}
                    label="Reservar espacio"
                  />
                  <LinkButton
                    href={WORKFLOW_LINKS.plantillaDifusion}
                    icon={<FileSpreadsheet className="h-4 w-4" aria-hidden="true" />}
                    label="Plantilla de difusión"
                  />
                  <LinkButton
                    href={WORKFLOW_LINKS.registroAsistencia}
                    icon={<FileSpreadsheet className="h-4 w-4" aria-hidden="true" />}
                    label="Registro de asistencia"
                  />
                  <LinkButton
                    href={WORKFLOW_LINKS.evidencias}
                    icon={<Upload className="h-4 w-4" aria-hidden="true" />}
                    label={EVIDENCE_ACTION_LABEL}
                    primary
                  />
                </div>
                {deadline && (
                  <p className="font-data mt-3 text-xs text-muted-foreground">
                    Evidencias hasta el {formatLongDate(deadline)}
                  </p>
                )}
              </section>
            )}

            <section className="card-uabc p-5">
              <h2 className="font-display text-base font-semibold text-ink">Contacto</h2>
              <dl className="mt-3">
                <Field label="Correo" compact>
                  <span className="font-data text-xs break-all">{event.email || "—"}</span>
                </Field>
                <Field label="Teléfono" compact>
                  <span className="font-data text-xs">{event.phone || "—"}</span>
                </Field>
              </dl>
            </section>

            <section className="card-uabc p-5">
              <h2 className="font-display text-base font-semibold text-ink">Registro</h2>
              <dl className="mt-3">
                <Field label="Creado" compact>
                  <span className="font-data text-xs">
                    {formatLongDate(new Date(event.createdAt))}
                  </span>
                </Field>
                <Field label="Actualizado" compact>
                  <span className="font-data text-xs">
                    {formatLongDate(new Date(event.updatedAt))}
                  </span>
                </Field>
                {semester && (
                  <Field label="Ciclo escolar" compact>
                    <span className="font-data text-xs">{semester}</span>
                  </Field>
                )}
              </dl>
            </section>
          </aside>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

function Field({
  label,
  children,
  compact = false,
}: {
  label: string
  children: React.ReactNode
  compact?: boolean
}) {
  return (
    <div className="field-row">
      <dt className={compact ? "shrink-0 text-sm font-medium text-muted-foreground sm:w-28" : "field-label"}>
        {label}
      </dt>
      <dd className="field-value">{children}</dd>
    </div>
  )
}

/**
 * Bloque de lectura para los campos largos. Medida de línea contenida y
 * interlínea amplia: son párrafos, no etiquetas.
 */
function LongText({
  title,
  body,
  empty,
  caption,
}: {
  title: string
  body?: string
  empty: string
  caption?: string
}) {
  const text = body?.trim()

  return (
    <section className="sheet-uabc p-5 sm:p-6">
      <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
      {caption && <p className="mt-1 text-xs text-muted-foreground">{caption}</p>}
      <div className="mt-3 max-w-[68ch]">
        {text ? (
          <p className="whitespace-pre-wrap text-[0.9375rem] leading-7 text-pretty text-foreground">
            {text}
          </p>
        ) : (
          <p className="text-sm italic text-muted-foreground">{empty}</p>
        )}
      </div>
    </section>
  )
}

function LinkButton({
  href,
  label,
  icon,
  primary = false,
}: {
  href: string
  label: string
  icon: React.ReactNode
  primary?: boolean
}) {
  return (
    <Button
      variant={primary ? "default" : "outline"}
      className={`h-auto w-full justify-start whitespace-normal py-2 text-left ${primary ? "btn-primary" : ""}`}
      onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
    >
      <span className="mr-2 shrink-0">{icon}</span>
      <span className="flex-1 text-sm">{label}</span>
      <ExternalLink className="ml-2 h-3 w-3 shrink-0 opacity-70" aria-hidden="true" />
    </Button>
  )
}
