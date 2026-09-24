import type { FieldPath, UseFormReturn } from "react-hook-form"
import type { ReportValues } from "@/lib/types"
export function ReportFieldError({
  form,
  name,
}: {
  form: UseFormReturn<ReportValues>
  name: FieldPath<ReportValues>
}) {
  const error = form.getFieldState(name, form.formState).error
  return error?.message ? (
    <span role="alert" className="mt-1 block text-xs text-destructive">
      {error.message}
    </span>
  ) : null
}
