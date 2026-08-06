import { TZDate } from "@date-fns/tz"
import { format } from "date-fns"

/**
 * All event dates are captured and displayed in the faculty's local time
 * (Tijuana) regardless of the visitor's device timezone, and stored in UTC.
 */
export const FMP_TIMEZONE = "America/Tijuana"

/**
 * Converts a datetime-local input value ("YYYY-MM-DDTHH:mm"), interpreted as
 * Tijuana wall time, to an ISO-8601 UTC string for storage.
 */
export function tijuanaLocalToUTC(local: string): string {
  const [datePart, timePart] = local.split("T")
  if (!datePart || !timePart) return local
  const [year, month, day] = datePart.split("-").map(Number)
  const [hours, minutes] = timePart.split(":").map(Number)
  const zoned = new TZDate(year, month - 1, day, hours, minutes, 0, FMP_TIMEZONE)
  return new Date(zoned.getTime()).toISOString()
}

/**
 * Converts a stored ISO-8601 UTC string to a datetime-local input value
 * ("YYYY-MM-DDTHH:mm") in Tijuana wall time. Returns "" for missing or
 * unparseable input.
 */
export function utcToTijuanaLocal(iso?: string): string {
  if (!iso) return ""
  const timestamp = new Date(iso).getTime()
  if (Number.isNaN(timestamp)) return ""
  return format(new TZDate(timestamp, FMP_TIMEZONE), "yyyy-MM-dd'T'HH:mm")
}
