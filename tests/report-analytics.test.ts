import { expect, it } from "vitest"
import { summarizeReports } from "@/lib/report-analytics"
import { semesterOf } from "@/lib/semester"
import { emptyReportValues } from "@/lib/event-report"
import { event, progress } from "./fixtures"
import type { EventReport } from "@/lib/types"
const report: EventReport = {
  ...emptyReportValues("a@example.test"),
  eventId: event.id,
  eventName: event.name,
  status: "submitted",
  teacherCount: 1,
  studentCount: 2,
  communityCount: 3,
  version: 2,
  firstSubmittedAt: "2026-09-21T18:00:00Z",
  submittedAt: "2026-10-30T18:00:00Z",
  updatedAt: "2026-10-30T18:00:00Z",
  attendanceBasis: "google",
  verifiedResponseCount: 20,
  verifiedSnapshotAt: "2026-09-21T18:00:00Z",
}
it("counts reported attendance once, excludes Google and drafts", () => {
  const result = summarizeReports(
    [
      { event, report, progress: { ...progress, report } },
      {
        event: { ...event, id: "other" },
        report: { ...report, status: "draft" },
        progress,
      },
    ],
    new Date("2026-10-30T18:00:00Z"),
  )
  expect(result.totalAttendance).toBe(6)
  expect(result.reportedEvents).toBe(1)
  expect(result.lateEvents).toBe(0)
  expect(result.meanAttendance).toBe(6)
})
it("uses no invented average for no reports", () =>
  expect(summarizeReports([], new Date()).meanAttendance).toBeNull())
it("uses the local semester at a UTC boundary", () =>
  expect(semesterOf("2026-07-01T01:00:00Z")).toBe("2026-1"))
it("does not truncate large results", () => {
  const rows = Array.from({ length: 1201 }, (_, i) => ({
    event: { ...event, id: String(i) },
    report: { ...report, eventId: String(i) },
    progress: { ...progress, report },
  }))
  expect(summarizeReports(rows, new Date()).totalAttendance).toBe(7206)
})
