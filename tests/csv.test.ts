import { expect, it } from "vitest"
import { createCsv } from "@/lib/csv"
it("escapes text and protects spreadsheet formulas", () => {
  const text = createCsv([
    ["Nombre", "Reseña"],
    ["=1+1", 'José, dijo "hola"\nOtra línea'],
    ["\t@formula", -12],
  ])
  expect(text.startsWith("\uFEFF")).toBe(true)
  expect(text).toContain("'=1+1")
  expect(text).toContain('"José, dijo ""hola""\nOtra línea"')
  expect(text).toContain("'\t@formula")
  expect(text).toContain("-12")
})
