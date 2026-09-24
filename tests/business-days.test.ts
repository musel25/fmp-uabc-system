import { expect, it } from "vitest"
import {
  earliestEventLocalDate,
  meetsRegistrationLead,
  latestRegistrationLocalDate,
} from "@/lib/business-days"
it.each([
  ["2026-09-21T19:00:00Z", "2026-09-28"],
  ["2026-09-25T19:00:00Z", "2026-10-02"],
  ["2026-09-26T19:00:00Z", "2026-10-02"],
  ["2026-03-06T20:00:00Z", "2026-03-13"],
  ["2026-09-26T02:00:00Z", "2026-10-02"],
])("Tijuana %s permits %s", (now, result) =>
  expect(earliestEventLocalDate(new Date(now))).toBe(result),
)
it("accepts boundary and rejects incomplete or impossible dates", () => {
  const now = new Date("2026-09-21T19:00:00Z")
  expect(meetsRegistrationLead("2026-09-28T00:00", now)).toBe(true)
  expect(meetsRegistrationLead("2026-09-27T23:59", now)).toBe(false)
  expect(meetsRegistrationLead("2026-09-31T10:00", now)).toBe(false)
  expect(meetsRegistrationLead("", now)).toBe(false)
})
it("inverse deadline includes weekend submission", () =>
  expect(latestRegistrationLocalDate("2026-10-03")).toBe("2026-09-27"))
