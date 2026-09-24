"use client"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import QRCode from "qrcode"
import { Button } from "@/components/ui/button"
import { createCsv, downloadCsv } from "@/lib/csv"
import { buildAttendanceLink } from "@/lib/attendance"
import { getWorkflowSettings } from "@/lib/supabase-progress"
import {
  getAttendanceSummary,
  getAttendancePage,
  getAllAttendanceResponses,
} from "@/lib/supabase-attendance"
import type { Event, AttendanceSummary, AttendanceResponse } from "@/lib/types"
export function AttendancePanel({
  event,
  onRefresh,
}: {
  event: Event
  onRefresh?: () => void
}) {
  const [url, setUrl] = useState<string | null>(null),
    [qr, setQr] = useState(""),
    [summary, setSummary] = useState<AttendanceSummary | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [people, setPeople] = useState<AttendanceResponse[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [showPeople, setShowPeople] = useState(false),
    [busy, setBusy] = useState(false)
  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const [s, a] = await Promise.all([
          getWorkflowSettings(),
          getAttendanceSummary(event.id),
        ])
        const link = buildAttendanceLink(s, event.id)
        const image = link
          ? await QRCode.toDataURL(link, {
              width: 800,
              margin: 4,
              errorCorrectionLevel: "M",
              color: { dark: "#000000", light: "#ffffff" },
            })
          : ""
        if (active) {
          setUrl(link)
          setQr(image)
          setSummary(a)
        }
      } catch {
        if (active)
          setError("No pudimos consultar la asistencia. Intenta actualizar.")
      }
    })()
    return () => {
      active = false
    }
  }, [event.id])
  const refresh = async () => {
    try {
      setBusy(true)
      setSummary(await getAttendanceSummary(event.id))
      setError("")
      onRefresh?.()
    } catch {
      setError("No se pudo actualizar. La asistencia sigue sin verificar.")
      setSummary(null)
    } finally {
      setBusy(false)
    }
  }
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setMessage("Copiado")
    } catch {
      setMessage(
        "No se pudo copiar automáticamente. Selecciona el enlace que aparece abajo.",
      )
    }
  }
  const loadPeople = async (next?: string) => {
    try {
      setBusy(true)
      const page = await getAttendancePage(event.id, next)
      setPeople((p) => (next ? [...p, ...page.responses] : page.responses))
      setCursor(page.nextCursor)
      setShowPeople(true)
      setError("")
    } catch {
      setError("No se pudieron consultar los participantes.")
    } finally {
      setBusy(false)
    }
  }
  const exportParticipants = async () => {
    setBusy(true)
    setError("")
    try {
      const all = await getAllAttendanceResponses(event.id)
      downloadCsv(
        createCsv([
          [
            "ID del evento",
            "Evento",
            "ID de respuesta",
            "Fecha (Tijuana)",
            "Nombre",
            "Correo",
            "Categoría",
          ],
          ...all.map((p) => [
            event.id,
            event.name,
            p.sourceResponseId,
            new Date(p.submittedAt).toLocaleString("es-MX", {
              timeZone: "America/Tijuana",
            }),
            p.name,
            p.email,
            p.category,
          ]),
        ]),
        "participantes-" + event.id + ".csv",
      )
    } catch {
      setError("No se pudo descargar la lista completa. Intenta de nuevo.")
    } finally {
      setBusy(false)
    }
  }
  const print = () => {
    if (!qr) return
    const popup = window.open("", "_blank")
    if (!popup) {
      setMessage("Permite la ventana de impresión o descarga el QR.")
      return
    }
    popup.opener = null
    const title = popup.document.createElement("h1")
    title.textContent = event.name
    const text = popup.document.createElement("p")
    text.textContent =
      "Registro de asistencia para participantes. Cada participante debe registrar su propia asistencia."
    const img = popup.document.createElement("img")
    img.src = qr
    img.width = 500
    img.alt = "QR de asistencia"
    const link = popup.document.createElement("p")
    link.textContent = url
    link.style.overflowWrap = "anywhere"
    popup.document.body.append(title, text, img, link)
    img.onload = () => popup.print()
  }
  return (
    <section className="card-uabc @container space-y-4 p-5" id="asistencia">
      <h2 className="font-display text-xl">
        Registro de asistencia para participantes
      </h2>
      <p className="text-sm leading-6">
        <strong>Este formulario lo llena cada participante.</strong> Proyecta o
        comparte el QR durante el evento y pide que cada persona registre su
        propia asistencia. Comprueben el ID del evento antes de enviar.
      </p>
      {url && qr ? (
        <>
          <div className="flex flex-col items-start gap-5 @md:flex-row">
            <Image
              src={qr}
              width={220}
              height={220}
              unoptimized
              alt={`QR para registrar asistencia a ${event.name}`}
              className="rounded-lg border bg-white"
            />
            <div className="space-y-3">
              <p className="font-medium">{event.name}</p>
              <div className="no-print flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <a href={qr} download={`asistencia-${event.id}.png`}>
                    Descargar QR
                  </a>
                </Button>
                <Button variant="outline" onClick={() => void copy(url)}>
                  Copiar enlace
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    void copy(
                      `Participantes de ${event.name}: registren su propia asistencia en ${url}. Comprueben el ID del evento antes de enviar. Si Google solicita iniciar sesión, usen la cuenta permitida por el formulario.`,
                    )
                  }
                >
                  Copiar instrucciones
                </Button>
                <Button variant="outline" onClick={print}>
                  Imprimir cartel
                </Button>
              </div>
              <a
                className="block break-all text-sm text-primary underline"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {url}
              </a>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-md bg-surface-2 p-4 text-sm">
          QR por evento pendiente de configuración. Coordinación debe conectar
          el formulario. Mientras tanto, puedes conservar una lista de
          asistencia.
        </div>
      )}
      <div className="rounded-md border p-4">
        <p className="font-medium">
          {summary?.state === "fresh"
            ? `${summary.responseCount} respuestas recibidas`
            : summary?.state === "stale"
              ? "Asistencia pendiente de actualización"
              : "Asistencia sin verificar"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {summary?.lastSyncedAt
            ? `Última sincronización: ${new Date(summary.lastSyncedAt).toLocaleString("es-MX", { timeZone: "America/Tijuana" })}. `
            : ""}
          Google se consulta aproximadamente cada 15 minutos. Las respuestas no
          equivalen necesariamente a personas únicas.
        </p>
        <div className="no-print mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void refresh()}
            disabled={busy}
          >
            Actualizar estado
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void loadPeople()}
            disabled={busy}
          >
            Ver participantes
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void exportParticipants()}
          >
            Descargar participantes CSV
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/events/${event.id}/attendance-list`}>
              Plantilla de lista alternativa
            </Link>
          </Button>
        </div>
      </div>
      {showPeople && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="p-2">Nombre</th>
                <th className="p-2">Correo</th>
                <th className="p-2">Categoría</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.sourceResponseId} className="border-t">
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">{p.email || "No capturado"}</td>
                  <td className="p-2">{p.category || "No capturada"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {people.length === 0 && (
            <p className="p-3 text-sm">
              No hay respuestas disponibles para este evento.
            </p>
          )}
          {cursor && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void loadPeople(cursor)}
            >
              Cargar más participantes
            </Button>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </section>
  )
}
