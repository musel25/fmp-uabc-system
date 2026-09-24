"use client"
import { ReportFieldError } from "./report-field-error"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  emptyReportValues,
  canWaiveAttendanceList,
  reportDraftSchema,
  reportSubmissionSchema,
} from "@/lib/event-report"
import {
  rememberReportEdit,
  recoverReportEdit,
  forgetReportEdit,
} from "@/lib/report-recovery"
import { saveEventReport } from "@/lib/supabase-reports"
import { ReportOrganizers } from "./report-organizers"
import { ReportEvidence } from "./report-evidence"
import type {
  Event,
  EventReport,
  ReportValues,
  AttendanceSummary,
} from "@/lib/types"
export function EventReportForm({
  event,
  report,
  attendance,
  onSaved,
}: {
  event: Event
  report: EventReport | null
  attendance: AttendanceSummary
  onSaved: (r: EventReport) => void
}) {
  const initial: ReportValues = report
    ? (Object.fromEntries(
        Object.keys(emptyReportValues("")).map((k) => [
          k,
          report[k as keyof ReportValues],
        ]),
      ) as unknown as ReportValues)
    : emptyReportValues(event.email || "")
  const form = useForm<ReportValues>({
    resolver: zodResolver(reportDraftSchema),
    defaultValues: initial,
  })
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [review, setReview] = useState(false),
    [savedAt, setSavedAt] = useState(report?.updatedAt)
  const router = useRouter()
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const leaving = useRef(false)
  const recoveryKey = event.userId + ":" + event.id
  const initialRef = useRef(initial)
  const [recovered, setRecovered] = useState(false)
  useEffect(() => {
    const pending = recoverReportEdit(recoveryKey, report?.version ?? 0)
    if (
      pending &&
      JSON.stringify(pending) !== JSON.stringify(initialRef.current)
    ) {
      form.reset(pending, { keepDefaultValues: true })
      setRecovered(true)
    }
    const subscription = form.watch(() =>
      rememberReportEdit(recoveryKey, report?.version ?? 0, form.getValues()),
    )
    return () => subscription.unsubscribe()
  }, [form, recoveryKey, report?.version])
  const dirty = form.formState.isDirty
  useEffect(() => {
    if (!dirty) return
    const guard = (e: BeforeUnloadEvent) => {
      if (leaving.current) return
      e.preventDefault()
      e.returnValue = ""
    }
    // Capture before Next Link handles SPA navigation. New tabs and evidence anchors are safe.
    const click = (e: MouseEvent) => {
      const a = e.target instanceof Element ? e.target.closest("a") : null
      if (
        !a ||
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        a.target === "_blank" ||
        a.hasAttribute("download")
      )
        return
      const url = new URL(a.href, location.href)
      if (url.pathname === location.pathname && url.search === location.search)
        return
      e.preventDefault()
      e.stopPropagation()
      setPendingHref(url.href)
    }
    window.addEventListener("beforeunload", guard)
    document.addEventListener("click", click, true)
    return () => {
      window.removeEventListener("beforeunload", guard)
      document.removeEventListener("click", click, true)
    }
  }, [dirty, recoveryKey])
  const submit = async (mode: "draft" | "submit") => {
    form.clearErrors()
    const parsed = (
      mode === "draft" ? reportDraftSchema : reportSubmissionSchema
    ).safeParse(form.getValues())
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join(". "))
      for (const issue of parsed.error.issues)
        form.setError(issue.path.join(".") as keyof ReportValues, {
          message: issue.message,
        })
      return
    }
    if (
      mode === "submit" &&
      !canWaiveAttendanceList(attendance) &&
      !parsed.data.attendanceListUrl
    ) {
      form.setError("attendanceListUrl", {
        message:
          "Agrega el enlace de la lista mientras la asistencia no esté verificada.",
      })
      setError("Falta el enlace de la lista de asistencia.")
      return
    }
    if (mode === "submit" && !review) {
      setReview(true)
      setError("")
      return
    }
    setBusy(true)
    setError("")
    try {
      const saved = await saveEventReport(
        event.id,
        parsed.data,
        mode,
        report?.version ?? 0,
      )
      form.reset(parsed.data)
      forgetReportEdit(recoveryKey)
      setSavedAt(saved.updatedAt)
      setReview(false)
      onSaved(saved)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo guardar. Tus cambios siguen en pantalla.",
      )
    } finally {
      setBusy(false)
    }
  }
  const values = form.watch()
  const total =
    (values.teacherCount ?? 0) +
    (values.studentCount ?? 0) +
    (values.communityCount ?? 0)
  const missing = new Set(
    reportSubmissionSchema
      .safeParse(values)
      .error?.issues.map((i) => i.path[0]) ?? [],
  )
  if (!canWaiveAttendanceList(attendance) && !values.attendanceListUrl.trim())
    missing.add("attendanceListUrl")
  const sections = [
    ["email", "teacherCount", "studentCount", "communityCount"],
    ["teacherMode", "studentMode", "teachers", "students"],
    ["attendanceListUrl", "photoUrls", "narrative"],
  ]
  const completed = sections.filter((fields) =>
    fields.every((field) => !missing.has(field)),
  ).length
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void submit("submit")
      }}
    >
      <AlertDialog
        open={pendingHref !== null}
        onOpenChange={(open) => {
          if (!open) setPendingHref(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir sin guardar?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar en el reporte. Si sales ahora, se
              descartarán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingHref) return
                const destination = new URL(pendingHref)
                leaving.current = true
                forgetReportEdit(recoveryKey)
                if (destination.origin === location.origin)
                  router.push(
                    destination.pathname +
                      destination.search +
                      destination.hash,
                  )
                else window.location.assign(destination.href)
              }}
            >
              Descartar y salir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <fieldset disabled={busy} className="space-y-6 min-w-0">
        <p className="text-sm text-muted-foreground" role="status">
          {completed} de 3 secciones completas · Revisa y envía al terminar.
        </p>
        {recovered && (
          <p role="status" className="rounded-lg border p-3 text-sm">
            Recuperamos los cambios sin guardar de esta pestaña. Revisa y guarda
            el reporte.
          </p>
        )}
        <section className="card-uabc space-y-4 p-5">
          <h2 className="font-display text-xl">1. Asistencia al evento</h2>
          <p className="text-sm text-muted-foreground">
            Cuenta a cada persona en una sola categoría. Escribe cero cuando no
            hubo asistentes de ese grupo.
          </p>
          <label className="block text-sm font-medium">
            Correo de contacto *
            <Input type="email" {...form.register("email")} />
            <ReportFieldError form={form} name="email" />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                ["teacherCount", "Docentes"],
                ["studentCount", "Alumnos"],
                ["communityCount", "Comunidad general"],
              ] as const
            ).map(([key, label]) => (
              <label className="block text-sm font-medium" key={key}>
                {label} *
                <Input
                  type="number"
                  min={0}
                  max={1000000}
                  step={1}
                  value={values[key] ?? ""}
                  onChange={(e) =>
                    form.setValue(
                      key,
                      e.target.value === "" ? null : Number(e.target.value),
                      { shouldDirty: true },
                    )
                  }
                />
                {form.formState.errors[key] && (
                  <span className="text-xs text-destructive">
                    {form.formState.errors[key]?.message}
                  </span>
                )}
              </label>
            ))}
          </div>
          <p>
            Total:{" "}
            <strong>
              {(values.teacherCount ?? 0) +
                (values.studentCount ?? 0) +
                (values.communityCount ?? 0)}
            </strong>
          </p>
        </section>
        {values.teacherCount === 0 &&
          values.studentCount === 0 &&
          values.communityCount === 0 && (
            <p className="text-sm">
              Registraste cero asistentes. Si el evento sí tuvo participación,
              revisa las cantidades antes de enviar.
            </p>
          )}
        {attendance.state === "fresh" && attendance.responseCount !== total && (
          <p className="text-sm">
            El total declarado ({total}) difiere de las{" "}
            {attendance.responseCount} respuestas electrónicas. Comprueba las
            cantidades; las respuestas pueden incluir duplicados o asistencia
            parcial.
          </p>
        )}
        <ReportOrganizers form={form} />
        <ReportEvidence form={form} attendance={attendance} />
        {review && (
          <section className="rounded-lg border border-primary bg-surface-2 p-5">
            <h2 className="font-display text-lg">Revisa antes de enviar</h2>
            <p className="mt-2 text-sm">
              {event.name} ·{" "}
              {(values.teacherCount ?? 0) +
                (values.studentCount ?? 0) +
                (values.communityCount ?? 0)}{" "}
              asistentes · {values.teachers.length + values.students.length}{" "}
              organizadores. Comprueba los nombres para constancias y los
              enlaces de evidencia.
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setReview(false)}
            >
              Volver a revisar campos
            </Button>
          </section>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-destructive p-4 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <div className="no-print flex flex-wrap items-center gap-3">
          {report?.status !== "submitted" && (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void submit("draft")}
            >
              Guardar borrador
            </Button>
          )}
          <Button
            type="submit"
            disabled={busy || new Date(event.endDate) > new Date()}
          >
            {busy
              ? "Guardando…"
              : review
                ? "Confirmar y enviar"
                : report?.status === "submitted"
                  ? "Guardar correcciones"
                  : "Revisar y enviar reporte"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {new Date(event.endDate) > new Date()
            ? "Puedes guardar un borrador. El envío se habilita cuando termine el evento."
            : savedAt
              ? `Guardado: ${new Date(savedAt).toLocaleString("es-MX", { timeZone: "America/Tijuana" })}`
              : "Tus cambios se guardan al pulsar Guardar borrador o enviar."}
          {dirty ? " · Cambios sin guardar" : ""}
        </p>
      </fieldset>
    </form>
  )
}
