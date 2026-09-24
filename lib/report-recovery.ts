import type { ReportValues } from "./types"
// Tab-memory only: survives SPA navigation without persisting personal data to disk.
const edits = new Map<string, { version: number; values: ReportValues }>()
export function rememberReportEdit(
  key: string,
  version: number,
  values: ReportValues,
) {
  edits.set(key, { version, values: structuredClone(values) })
}
export function recoverReportEdit(
  key: string,
  version: number,
): ReportValues | null {
  const entry = edits.get(key)
  return entry?.version === version ? structuredClone(entry.values) : null
}
export function forgetReportEdit(key: string) {
  edits.delete(key)
}
