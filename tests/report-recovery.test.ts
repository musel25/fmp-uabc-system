import { expect, it } from "vitest"
import { emptyReportValues } from "@/lib/event-report"
import {
  rememberReportEdit,
  recoverReportEdit,
  forgetReportEdit,
} from "@/lib/report-recovery"
it("recovers edits after SPA navigation without crossing versions or owners", () => {
  const values = emptyReportValues("a@example.test")
  values.narrative = "Edición pendiente"
  rememberReportEdit("owner:event", 3, values)
  values.narrative = "Changed reference"
  expect(recoverReportEdit("owner:event", 3)?.narrative).toBe(
    "Edición pendiente",
  )
  expect(recoverReportEdit("other:event", 3)).toBeNull()
  expect(recoverReportEdit("owner:event", 4)).toBeNull()
  forgetReportEdit("owner:event")
  expect(recoverReportEdit("owner:event", 3)).toBeNull()
})
