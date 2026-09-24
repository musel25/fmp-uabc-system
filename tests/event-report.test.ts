import { expect, it } from "vitest"
import {
  emptyReportValues,
  reportDraftSchema,
  reportSubmissionSchema,
  countReportWords,
  canWaiveAttendanceList,
} from "@/lib/event-report"
const complete = () => ({
  ...emptyReportValues("a@example.test"),
  teacherCount: 0,
  studentCount: 2,
  communityCount: 1,
  teacherMode: "none" as const,
  studentMode: "none" as const,
  narrative: "reseña del evento",
  attendanceListUrl: "https://example.test/list",
})
it("distinguishes unanswered and zero", () => {
  expect(reportDraftSchema.safeParse(emptyReportValues("")).success).toBe(true)
  expect(
    reportSubmissionSchema.safeParse(emptyReportValues("a@example.test"))
      .success,
  ).toBe(false)
  expect(reportSubmissionSchema.safeParse(complete()).success).toBe(true)
})
it.each([-1, 0.5, 1000001])("rejects invalid count %s", (value) =>
  expect(
    reportSubmissionSchema.safeParse({ ...complete(), teacherCount: value })
      .success,
  ).toBe(false),
)
it("normalizes uppercase and limits words", () => {
  expect(reportSubmissionSchema.parse(complete()).narrative).toBe(
    "RESEÑA DEL EVENTO",
  )
  expect(
    reportSubmissionSchema.safeParse({
      ...complete(),
      narrative: "hola ".repeat(250),
    }).success,
  ).toBe(true)
  expect(
    reportSubmissionSchema.safeParse({
      ...complete(),
      narrative: "hola ".repeat(251),
    }).success,
  ).toBe(false)
  expect(countReportWords("uno\u00a0dos\n tres")).toBe(3)
})
it("requires complete organizers and secure links", () => {
  expect(
    reportSubmissionSchema.safeParse({
      ...complete(),
      teacherMode: "listed",
      teachers: [{ name: "José", degree: "" }],
    }).success,
  ).toBe(false)
  expect(
    reportSubmissionSchema.safeParse({
      ...complete(),
      photoUrls: ["javascript:alert(1)"],
    }).success,
  ).toBe(false)
})
it("exempts only a recent positive snapshot", () => {
  const s = {
    eventId: "e",
    state: "fresh" as const,
    responseCount: 2,
    lastSyncedAt: "2026-09-23T10:00:00Z",
  }
  expect(canWaiveAttendanceList(s, new Date("2026-09-23T10:30:00Z"))).toBe(true)
  expect(canWaiveAttendanceList(s, new Date("2026-09-23T11:00:01Z"))).toBe(
    false,
  )
  expect(
    canWaiveAttendanceList(
      { ...s, state: "unconfigured" },
      new Date("2026-09-23T10:30:00Z"),
    ),
  ).toBe(false)
})
