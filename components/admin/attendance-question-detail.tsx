"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  attendanceCsvRows,
  attendanceQuestionStats,
} from "@/lib/attendance-analytics"
import { createCsv, downloadCsv } from "@/lib/csv"
import { getAllAttendanceResponses } from "@/lib/supabase-attendance"
import type { AttendanceResponse, Event } from "@/lib/types"

export function AttendanceQuestionDetail({ event }: { event: Event }) {
  const [responses, setResponses] = useState<AttendanceResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError("")
    setResponses([])
    void getAllAttendanceResponses(event.id)
      .then((data) => {
        if (active) setResponses(data)
      })
      .catch(() => {
        if (active) setError("No se pudieron cargar las respuestas de este evento.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [event.id, reload])
  const questions = useMemo(() => attendanceQuestionStats(responses), [responses])
  const csv = useMemo(() => attendanceCsvRows(event, responses), [event, responses])
  return (
    <section className="card-uabc space-y-4 p-5" id="preguntas-asistencia">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">
            Preguntas de asistencia: {event.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {responses.length} respuestas de Google. Una respuesta no equivale
            necesariamente a una persona única.
          </p>
        </div>
        <Button
          disabled={loading || !!error}
          onClick={() => downloadCsv(createCsv(csv), `asistencia-${event.id}.csv`)}
        >
          Descargar asistencia CSV
        </Button>
      </div>
      {loading && <p role="status">Consultando respuestas…</p>}
      {error && (
        <div className="space-y-2">
          <p role="alert" className="text-destructive">{error}</p>
          <Button variant="outline" onClick={() => setReload((n) => n + 1)}>
            Reintentar
          </Button>
        </div>
      )}
      {!loading && !error && responses.length === 0 && (
        <p>No hay respuestas sincronizadas para este evento.</p>
      )}
      {!loading && !error && responses.length > 0 && questions.length === 0 && (
        <p>
          Las respuestas anteriores no tienen preguntas detalladas. La próxima
          sincronización agregará los datos disponibles.
        </p>
      )}
      {!loading && !error && questions.length > 0 && (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            {questions.map((question) => (
              <div className="rounded-md border p-4" key={question.questionId}>
                <h3 className="font-medium">{question.question}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {question.responses} respuestas
                </p>
                {question.kind === "choice" ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {[...question.choices]
                      .sort(
                        (a, b) =>
                          b.count - a.count ||
                          a.value.localeCompare(b.value, "es-MX"),
                      )
                      .map((choice) => (
                        <li
                          className="flex justify-between gap-3"
                          key={choice.value}
                        >
                          <span>{choice.value}</span>
                          <span className="font-medium">{choice.count}</span>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm">
                    Consulta los valores en la tabla o el archivo CSV.
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Se muestran hasta 100 respuestas. El archivo CSV incluye todas.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {csv[0].map((title, index) => (
                    <th className="whitespace-nowrap border-b p-2" key={index}>
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csv.slice(1, 101).map((row, index) => (
                  <tr className="border-t" key={responses[index].sourceResponseId}>
                    {row.map((value, cell) => (
                      <td className="max-w-72 break-words p-2" key={cell}>
                        {value ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
