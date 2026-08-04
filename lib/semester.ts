/**
 * Ciclos escolares UABC.
 *
 * UABC names each school term `AAAA-N`:
 *   `2026-1` → enero–junio 2026   (semestre par de primavera)
 *   `2026-2` → julio–diciembre 2026 (el ciclo 2025-2 inició el 11 de agosto)
 *
 * Every analytics view groups by this code, so the derivation lives here and
 * nowhere else.
 */

export type Semester = string // "2026-1" | "2026-2" | …

/** Month (1-12) at which the second term of the year starts. */
const SECOND_TERM_START_MONTH = 7

/**
 * Reads the calendar parts of an ISO timestamp without going through the
 * local timezone, so an event stored as `2026-01-01T00:00:00Z` never slides
 * into the previous year for a viewer west of UTC.
 */
function calendarParts(dateISO: string): { year: number; month: number } | null {
  if (!dateISO) return null

  const iso = /^(\d{4})-(\d{2})/.exec(dateISO)
  if (iso) {
    return { year: Number(iso[1]), month: Number(iso[2]) }
  }

  const parsed = new Date(dateISO)
  if (Number.isNaN(parsed.getTime())) return null
  return { year: parsed.getUTCFullYear(), month: parsed.getUTCMonth() + 1 }
}

/** `"2026-03-14T…"` → `"2026-1"`. Returns `null` for unusable input. */
export function semesterOf(dateISO?: string | null): Semester | null {
  if (!dateISO) return null
  const parts = calendarParts(dateISO)
  if (!parts) return null
  const term = parts.month >= SECOND_TERM_START_MONTH ? 2 : 1
  return `${parts.year}-${term}`
}

/** Chronological sort key for a `AAAA-N` code. */
export function semesterOrder(semester: Semester): number {
  const [year, term] = semester.split("-")
  return Number(year) * 10 + Number(term)
}

/** Sorts semester codes oldest → newest. */
export function sortSemesters(semesters: Semester[]): Semester[] {
  return [...semesters].sort((a, b) => semesterOrder(a) - semesterOrder(b))
}

/**
 * Every semester represented in `items`, oldest first, with the gaps filled in
 * — a semester with zero events still deserves a column, otherwise the curve
 * lies about the shape of the year.
 */
export function semesterRange(dates: Array<string | undefined | null>): Semester[] {
  const present = dates
    .map((d) => semesterOf(d))
    .filter((s): s is Semester => s !== null)

  if (present.length === 0) return []

  const sorted = sortSemesters(Array.from(new Set(present)))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  const out: Semester[] = []
  let [year, term] = first.split("-").map(Number)
  const lastKey = semesterOrder(last)

  // Guard against a runaway loop if the data holds an absurd year.
  for (let guard = 0; guard < 200; guard++) {
    const code = `${year}-${term}`
    out.push(code)
    if (semesterOrder(code) >= lastKey) break
    if (term === 1) {
      term = 2
    } else {
      term = 1
      year += 1
    }
  }

  return out
}

/** The semester the given moment falls in — defaults to now. */
export function currentSemester(now: Date = new Date()): Semester {
  const term = now.getMonth() + 1 >= SECOND_TERM_START_MONTH ? 2 : 1
  return `${now.getFullYear()}-${term}`
}

/** Human-readable span, e.g. `"ene–jun 2026"`. */
export function semesterLabel(semester: Semester): string {
  const [year, term] = semester.split("-")
  return term === "1" ? `ene–jun ${year}` : `jul–dic ${year}`
}
