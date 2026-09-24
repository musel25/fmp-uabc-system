"use client"
import { ReportFieldError } from "./report-field-error"
import { useFieldArray, type UseFormReturn } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ReportValues } from "@/lib/types"
export function ReportOrganizers({
  form,
}: {
  form: UseFormReturn<ReportValues>
}) {
  const teachers = useFieldArray({ control: form.control, name: "teachers" }),
    students = useFieldArray({ control: form.control, name: "students" })
  return (
    <section className="card-uabc space-y-6 p-5">
      <h2 className="font-display text-xl">
        2. Organizadores para las constancias
      </h2>
      <p className="text-sm text-muted-foreground">
        Escribe los nombres y grados tal como deben aparecer en la constancia.
      </p>
      {(["teacher", "student"] as const).map((kind) => {
        const isTeacher = kind === "teacher",
          mode = isTeacher ? "teacherMode" : "studentMode"
        return (
          <fieldset key={kind} className="space-y-3">
            <legend className="mb-2 font-medium">
              {isTeacher
                ? "Docentes organizadores"
                : "Estudiantes organizadores"}
            </legend>
            <div className="flex gap-6">
              {(["listed", "none"] as const).map((value) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={mode}
                    checked={form.watch(mode) === value}
                    onChange={() => {
                      form.setValue(mode, value, { shouldDirty: true })
                      if (value === "none") {
                        if (isTeacher) teachers.replace([])
                        else students.replace([])
                      } else if (isTeacher && teachers.fields.length === 0) {
                        teachers.append({ name: "", degree: "" })
                      } else if (!isTeacher && students.fields.length === 0) {
                        students.append({ name: "", level: "licenciatura" })
                      }
                    }}
                  />
                  {value === "listed" ? "Sí participaron" : "No participaron"}
                </label>
              ))}
            </div>
            <ReportFieldError form={form} name={mode} />
            <ReportFieldError
              form={form}
              name={isTeacher ? "teachers" : "students"}
            />
            {form.watch(mode) === "listed" && (
              <div className="space-y-3">
                {(isTeacher ? teachers.fields : students.fields).map(
                  (row, i) => (
                    <div
                      className="grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_1fr_auto]"
                      key={row.id}
                    >
                      <label className="text-sm">
                        Nombre completo
                        <Input
                          {...form.register(
                            isTeacher
                              ? `teachers.${i}.name`
                              : `students.${i}.name`,
                          )}
                        />
                      </label>
                      {isTeacher ? (
                        <label className="text-sm">
                          Grado
                          <Input
                            {...form.register(`teachers.${i}.degree`)}
                            placeholder="Ej. Dra., Mtro., Lic."
                          />
                        </label>
                      ) : (
                        <label className="text-sm">
                          Nivel
                          <select
                            className="mt-1 w-full rounded-md border bg-background p-2"
                            {...form.register(`students.${i}.level`)}
                          >
                            <option value="licenciatura">Licenciatura</option>
                            <option value="maestria">Maestría</option>
                            <option value="otro_posgrado">Otro posgrado</option>
                          </select>
                        </label>
                      )}
                      <ReportFieldError
                        form={form}
                        name={
                          isTeacher
                            ? `teachers.${i}.name`
                            : `students.${i}.name`
                        }
                      />
                      <ReportFieldError
                        form={form}
                        name={
                          isTeacher
                            ? `teachers.${i}.degree`
                            : `students.${i}.level`
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="self-end"
                        onClick={() =>
                          isTeacher ? teachers.remove(i) : students.remove(i)
                        }
                      >
                        Eliminar
                      </Button>
                    </div>
                  ),
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    isTeacher
                      ? teachers.append({ name: "", degree: "" })
                      : students.append({ name: "", level: "licenciatura" })
                  }
                >
                  Agregar {isTeacher ? "docente" : "estudiante"}
                </Button>
              </div>
            )}
          </fieldset>
        )
      })}
    </section>
  )
}
