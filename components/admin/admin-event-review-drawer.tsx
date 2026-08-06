"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { StatusBadge } from "@/components/ui/status-badge"
import { Check, ExternalLink, X } from "lucide-react"
import { formatDateTime } from "@/lib/workflow"
import { semesterOf } from "@/lib/semester"
import type { Event } from "@/lib/types"

interface AdminEventReviewDrawerProps {
  event: Event | null
  isOpen: boolean
  onClose: () => void
  onReview: (
    eventId: string,
    action: "approve" | "reject",
    comments?: string,
    rejectionReason?: string,
  ) => void
}

export function AdminEventReviewDrawer({
  event,
  isOpen,
  onClose,
  onReview,
}: AdminEventReviewDrawerProps) {
  const [comments, setComments] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [reasonError, setReasonError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Cada evento se revisa en limpio: los comentarios del anterior no se heredan.
  useEffect(() => {
    setComments("")
    setRejectionReason("")
    setReasonError(null)
  }, [event?.id])

  if (!event) return null

  const handleReview = async (action: "approve" | "reject") => {
    if (action === "reject" && !rejectionReason.trim()) {
      setReasonError("Escribe qué debe corregir la persona organizadora.")
      return
    }

    setReasonError(null)
    setIsSubmitting(true)
    try {
      await onReview(
        event.id,
        action,
        comments.trim() || undefined,
        rejectionReason.trim() || undefined,
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const semester = semesterOf(event.startDate)
  const pending = event.status === "en_revision"

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="space-y-3 border-b border-border p-5 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="font-display text-lg text-balance">{event.name}</SheetTitle>
              <SheetDescription>
                Solicitud de {event.responsible || "responsable no especificado"}
                {semester && ` · ciclo ${semester}`}
              </SheetDescription>
            </div>
            <StatusBadge status={event.status} className="shrink-0" />
          </div>
          <Button asChild variant="outline" size="sm" className="w-fit">
            <Link href={`/events/${event.id}`} target="_blank">
              Abrir ficha completa
              <ExternalLink className="ml-1.5 h-3 w-3" aria-hidden="true" />
            </Link>
          </Button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5">
          <Section title="Datos del evento">
            <Field label="Inicio">
              <span className="font-data text-xs">{formatDateTime(event.startDate)}</span>
            </Field>
            <Field label="Fin">
              <span className="font-data text-xs">{formatDateTime(event.endDate)}</span>
            </Field>
            <Field label="Modalidad">{event.modality}</Field>
            <Field label="Sede">{event.venue || "No aplica"}</Field>
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
              {event.hasCost ? "Con costo — requiere educación continua" : "Sin costo"}
            </Field>
            <Field label="Autorización">
              {event.isAuthorized === null
                ? "Sin registrar"
                : event.isAuthorized
                  ? "Autorizado por dirección o subdirección"
                  : "Aún sin autorización"}
            </Field>
            <Field label="Usuario UABC">
              {event.userType === null ? "Sin registrar" : event.userType === "externo" ? "Externo" : "Interno"}
            </Field>
            <Field label="Categorías SEAES">
              {event.seaesCategories.length > 0 ? event.seaesCategories.join("; ") : "—"}
            </Field>
          </Section>

          <Section title="Contacto">
            <Field label="Correo">
              <span className="font-data text-xs break-all">{event.email || "—"}</span>
            </Field>
            <Field label="Teléfono">
              <span className="font-data text-xs">{event.phone || "—"}</span>
            </Field>
          </Section>

          {(event.modality === "En línea" || event.modality === "Mixta") && event.onlineInfo && (
            <LongText title="Acceso en línea" body={event.onlineInfo} />
          )}

          <LongText title="Descripción del evento" body={event.programDetails} />
          <LongText title="Semblanza curricular de ponentes" body={event.speakerCvs} />
          <LongText title="Organizadores" body={event.organizers} />
          {event.observations && <LongText title="Observaciones" body={event.observations} />}

          {event.adminComments && (
            <LongText title="Comentarios anteriores" body={event.adminComments} />
          )}
          {event.rejectionReason && (
            <LongText title="Motivo de rechazo registrado" body={event.rejectionReason} />
          )}
        </div>

        {pending && (
          <div className="border-t border-border bg-surface-2/60 p-5">
            <h3 className="font-display text-sm font-semibold text-ink">Resolver la solicitud</h3>

            <div className="mt-3 space-y-3">
              <div>
                <Label htmlFor="comments" className="text-xs">
                  Comentarios para la persona organizadora (opcional)
                </Label>
                <Textarea
                  id="comments"
                  placeholder="Indicaciones o recordatorios que acompañan la resolución"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="mt-1 bg-card"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="rejectionReason" className="text-xs">
                  Motivo del rechazo
                </Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Qué debe corregir para volver a enviarlo"
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value)
                    if (reasonError) setReasonError(null)
                  }}
                  aria-invalid={reasonError ? true : undefined}
                  aria-describedby={reasonError ? "rejectionReason-error" : undefined}
                  className="mt-1 bg-card"
                  rows={2}
                />
                <p
                  id="rejectionReason-error"
                  className={`mt-1 text-xs ${reasonError ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {reasonError ?? "Se requiere sólo para rechazar."}
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => handleReview("approve")}
                disabled={isSubmitting}
                className="btn-primary flex-1"
              >
                <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                {isSubmitting ? "Guardando…" : "Aprobar"}
              </Button>
              <Button
                onClick={() => handleReview("reject")}
                disabled={isSubmitting}
                variant="destructive"
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" aria-hidden="true" />
                {isSubmitting ? "Guardando…" : "Rechazar"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="eyebrow mb-1">{title}</h3>
      <dl>{children}</dl>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field-row">
      <dt className="shrink-0 text-sm font-medium text-muted-foreground sm:w-36">{label}</dt>
      <dd className="field-value">{children}</dd>
    </div>
  )
}

function LongText({ title, body }: { title: string; body?: string }) {
  const text = body?.trim()
  return (
    <section className="mb-5">
      <h3 className="eyebrow mb-1.5">{title}</h3>
      <div className="rounded-md border border-border bg-surface-2/40 p-3.5">
        {text ? (
          <p className="max-w-[68ch] whitespace-pre-wrap text-sm leading-6 text-pretty text-foreground">
            {text}
          </p>
        ) : (
          <p className="text-sm italic text-muted-foreground">Sin información.</p>
        )}
      </div>
    </section>
  )
}
