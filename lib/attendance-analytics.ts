import type { AttendanceResponse, Event } from "./types"
import { formatDateTime } from "./workflow"

export function attendanceQuestionStats(responses: AttendanceResponse[]) {
  const questions = new Map<
    string,
    {
      questionId: string
      question: string
      kind: "choice" | "text"
      responses: number
      choices: { value: string; count: number }[]
    }
  >()
  for (const response of responses) {
    for (const answer of response.answers) {
      let question = questions.get(answer.questionId)
      if (!question) {
        question = {
          questionId: answer.questionId,
          question: answer.question,
          kind: answer.kind,
          responses: 0,
          choices: [],
        }
        questions.set(answer.questionId, question)
      }
      question.responses++
      if (question.kind === "choice") {
        for (const value of new Set(
          Array.isArray(answer.value) ? answer.value : [answer.value],
        )) {
          const option = question.choices.find((choice) => choice.value === value)
          if (option) option.count++
          else question.choices.push({ value, count: 1 })
        }
      }
    }
  }
  return [...questions.values()]
}

export function attendanceCsvRows(
  event: Event,
  responses: AttendanceResponse[],
): Array<Array<string | number | null>> {
  const questions = new Map<string, string>()
  for (const response of responses) {
    for (const answer of response.answers) questions.set(answer.questionId, answer.question)
  }
  const ids = [...questions.keys()]
  return [
    [
      "ID del evento",
      "Evento",
      "ID de respuesta",
      "Fecha (Tijuana)",
      "Nombre",
      "Correo",
      "Categoría",
      ...questions.values(),
    ],
    ...responses.map((response) => {
      const answers = new Map(
        response.answers.map((answer) => [answer.questionId, answer.value]),
      )
      return [
        event.id,
        event.name,
        response.sourceResponseId,
        formatDateTime(response.submittedAt),
        response.name,
        response.email,
        response.category,
        ...ids.map((id) => {
          const value = answers.get(id)
          return Array.isArray(value) ? value.join("; ") : value ?? ""
        }),
      ]
    }),
  ]
}
