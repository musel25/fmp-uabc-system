/** Civil calendar arithmetic; UTC here represents a date, never a user's timezone. */
export const MIN_LEAD_BUSINESS_DAYS = 5
export function tijuanaDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Tijuana",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now)
  return ["year", "month", "day"]
    .map((key) => parts.find((p) => p.type === key)!.value)
    .join("-")
}
function civil(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? date
    : null
}
const business = (d: Date) => d.getUTCDay() !== 0 && d.getUTCDay() !== 6
export function earliestEventLocalDate(now: Date): string {
  const cursor = civil(tijuanaDate(now))!
  let count = 0
  while (count < MIN_LEAD_BUSINESS_DAYS) {
    cursor.setUTCDate(cursor.getUTCDate() + 1)
    if (business(cursor)) count++
  }
  return cursor.toISOString().slice(0, 10)
}
export function meetsRegistrationLead(startLocal: string, now: Date): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(startLocal))
    return false
  return (
    civil(startLocal.slice(0, 10)) !== null &&
    startLocal.slice(0, 10) >= earliestEventLocalDate(now)
  )
}
export function latestRegistrationLocalDate(startLocalDate: string): string {
  const cursor = civil(startLocalDate)
  if (!cursor) throw new Error("Fecha inválida")
  let count = 0
  while (count < MIN_LEAD_BUSINESS_DAYS) {
    if (business(cursor)) count++
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return cursor.toISOString().slice(0, 10)
}
export function addCivilDays(date: string, days: number): string {
  const cursor = civil(date)
  if (!cursor) throw new Error("Fecha inválida")
  cursor.setUTCDate(cursor.getUTCDate() + days)
  return cursor.toISOString().slice(0, 10)
}
