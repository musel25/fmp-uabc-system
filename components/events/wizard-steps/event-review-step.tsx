"use client"

import { useState, useEffect } from "react"
import type { UseFormReturn } from "react-hook-form"
import { Info } from "lucide-react"
import { getAuthUser } from "@/lib/supabase-auth"
import type { EventWizardValues } from "@/lib/event-form"
import type { AuthUser } from "@/lib/supabase-auth"
import { SUBMISSION_NOTES, formatDateTime } from "@/lib/workflow"
import { semesterOf } from "@/lib/semester"

interface EventReviewStepProps {
  form: UseFormReturn<EventWizardValues>
}

export function EventReviewStep({ form }: EventReviewStepProps) {
  const data = form.getValues()
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    let mounted = true
    getAuthUser().then((user) => {
      if (mounted) setAuthUser(user)
    })
    return () => {
      mounted = false
    }
  }, [])

  const semester = semesterOf(data.startDate)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-semibold text-ink">{data.name || "Sin nombre"}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Responsable: {authUser?.name ?? "…"}
          {semester && ` · ciclo ${semester}`}
        </p>
      </div>

      <section>
        <h4 className="eyebrow mb-1">Datos del evento</h4>
        <dl>
          <Field label="Inicio">
            <span className="font-data text-xs">
              {data.startDate ? formatDateTime(data.startDate) : "No especificada"}
            </span>
          </Field>
          <Field label="Fin">
            <span className="font-data text-xs">
              {data.endDate ? formatDateTime(data.endDate) : "No especificada"}
            </span>
          </Field>
          <Field label="Modalidad">{data.modality}</Field>
          <Field label="Sede">{data.venue || "No aplica"}</Field>
          <Field label="Programa">{data.program}</Field>
          <Field label="Tipo">{data.type}</Field>
          <Field label="Clasificación">
            {data.classification === "Otro" && data.classificationOther
              ? `Otro — ${data.classificationOther}`
              : data.classification}
          </Field>
          <Field label="Códigos 8 = 1">
            <span className="font-data text-xs">{data.codigosRequeridos}</span>
          </Field>
          <Field label="Autorización">
            {data.isAuthorized === "si"
              ? "Autorizado por dirección o subdirección"
              : "Aún sin autorización de dirección o subdirección"}
          </Field>
          <Field label="Usuario UABC">
            {data.userType === "externo" ? "Externo" : "Interno"}
          </Field>
          <Field label="Categorías SEAES">
            {data.seaesCategories?.length ? data.seaesCategories.join("; ") : "—"}
          </Field>
        </dl>
      </section>

      <section>
        <h4 className="eyebrow mb-1">Contacto</h4>
        <dl>
          <Field label="Correo">
            <span className="font-data text-xs break-all">{authUser?.email ?? "…"}</span>
          </Field>
          <Field label="Teléfono">
            <span className="font-data text-xs">{data.phone || "—"}</span>
          </Field>
        </dl>
      </section>

      {(data.modality === "En línea" || data.modality === "Mixta") && data.onlineInfo && (
        <LongText title="Acceso en línea" body={data.onlineInfo} />
      )}

      <LongText title="Descripción del evento" body={data.programDetails} />
      <LongText title="Semblanza curricular de ponentes" body={data.speakerCvs} />
      <LongText title="Organizadores" body={data.organizers} />
      {data.observations && <LongText title="Observaciones" body={data.observations} />}

      <section className="rounded-lg border border-[var(--state-info-line)] bg-[var(--state-info-bg)] p-4">
        <h4 className="flex items-center gap-2 font-display text-sm font-semibold text-[var(--state-info)]">
          <Info className="h-4 w-4" aria-hidden="true" />
          Antes de enviar, ten presente
        </h4>
        <ul className="mt-2.5 space-y-1.5">
          {SUBMISSION_NOTES.map((note) => (
            <li key={note} className="flex gap-2 text-sm text-pretty text-foreground/90">
              <span
                className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--state-info)]"
                aria-hidden="true"
              />
              {note}
            </li>
          ))}
        </ul>
      </section>
    </div>
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
    <section>
      <h4 className="eyebrow mb-1.5">{title}</h4>
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
