import { expect, it } from "vitest"
import { isPendingReport, buildEventChecklist } from "@/lib/event-progress"
import { event, progress } from "./fixtures"
const now = new Date("2026-09-23T19:00:00Z")
it("keeps unknown distinct from no pending reports", () =>
  expect(isPendingReport(event, { state: "unavailable" }, now)).toBeNull())
it("tracks only current ended approved events", () => {
  expect(isPendingReport(event, progress, now)).toBe(true)
  expect(isPendingReport(event, { ...progress, tracking: "legacy" }, now)).toBe(
    false,
  )
  expect(
    isPendingReport({ ...event, status: "rechazado" }, progress, now),
  ).toBe(false)
})
it("a submitted report completes attendance and leaves pending count", () => {
  const p = {
    ...progress,
    report: {
      status: "submitted" as const,
      version: 1,
      submittedAt: now.toISOString(),
      firstSubmittedAt: now.toISOString(),
      attendanceBasis: "list" as const,
    },
  }
  expect(isPendingReport(event, p, now)).toBe(false)
  expect(
    buildEventChecklist(event, p, now).find((s) => s.id === "report")?.state,
  ).toBe("done")
  expect(
    buildEventChecklist(event, p, now).find((s) => s.id === "attendance")
      ?.state,
  ).toBe("done")
})
it("manual QR confirmation never verifies attendance", () => {
  const p = {
    ...progress,
    preparation: { ...progress.preparation, qrShared: true },
  }
  expect(
    buildEventChecklist(event, p, now).find((s) => s.id === "attendance")
      ?.state,
  ).not.toBe("done")
})

import { evidenceDeadline } from "@/lib/workflow"
it("includes the entire final local day across daylight saving", () => {
  expect(
    evidenceDeadline({ endDate: "2026-10-20T19:00:00Z" })?.toISOString(),
  ).toBe("2026-11-11T07:59:59.999Z")
})
