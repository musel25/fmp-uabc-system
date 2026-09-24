# Reportes finales, asistencia y checklist — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking. Ejecutar en esta sesión con el modelo que el usuario elija; no crear tareas nuevas ni agentes sin una instrucción aplicable que los autorice.

**Goal:** Registrar eventos con cinco días hábiles de anticipación y conectar su reporte final, asistencia verificable, checklist y estadísticas.

**Architecture:** El reporte y la preparación se guardan en tablas separadas de events con RLS y RPCs de escritura acotadas. Apps Script conserva Google Forms como captura de participantes y sincroniza snapshots firmados por evento; la base decide si procede exentar la lista. Los componentes existentes consumen un resumen común de progreso.

**Tech Stack:** Next.js 15, React 19, TypeScript strict, Supabase/PostgreSQL, React Hook Form, Zod 3, Tailwind v4, Recharts, Apps Script; Vitest para reglas y qrcode para generar QR localmente.

**Spec:** [Diseño y decisiones](../specs/2026-09-23-event-reports-design.md). Leer ambos archivos completos antes de implementar.

## Global Constraints

- Next.js 15, TypeScript strict, Tailwind v4, React Hook Form + Zod y Supabase.
- Interfaz y errores en español es-MX; conservar marca UABC y modo oscuro.
- Fechas de negocio en America/Tijuana; instantes persistidos en UTC.
- Conservar el flujo en_revision → aprobado/rechazado y sus correos existentes.
- No permitir que usuarios modifiquen eventos aprobados ni sus estados.
- No introducir una service-role key en el proyecto.
- Nuevas tablas con RLS; la interfaz nunca es la frontera de autorización.
- Conversiones snake_case/camelCase centralizadas en lib/event-mapper.ts.
- No modificar manualmente components/ui; componer los componentes existentes.
- Commit convencional y push después de cada unidad de trabajo.

## Review Focus

1. Cambio de día/semestre en Tijuana y horario de verano: mismo resultado en cualquier zona del dispositivo. Pruebas en tareas 1 y 7.
2. Carga incompleta o conexión de Google caída: mostrar desconocido/desactualizado, no cero ni exención. Pruebas en tareas 2, 4 y 6.
3. Form precargado editable, campos renombrados o ID inválido: no atribuir participantes a un evento por nombre. Pruebas en tareas 4 y 5.
4. Reporte corregido mientras otra pestaña guarda, o asistencia que cambia al enviar: conflicto explícito y decisión atómica en DB. Pruebas en tareas 2 y 3.
5. Eventos históricos, más de 1,000 filas, celdas con fórmulas: no inventar incumplimientos, truncar ni ejecutar fórmulas. Pruebas en tareas 6 y 7.

## Estado de partida y ejecución

- Base inspeccionada: commit `2dde664` en master. La rama de planificación es `codex/plan-event-reports-and-checklist`.
- `AGENTS.md` ya estaba sin seguimiento antes de planificar; no añadirlo a commits de esta función por accidente.
- No existe suite de pruebas. `npm run build`, `npm run lint` y `npx tsc --noEmit` son los controles actuales.
- Formularios de evidencia/asistencia hoy son enlaces en `lib/workflow.ts`; las estadísticas actuales solo usan events y cargan hasta 1,000 filas.
- El wizard valida anticipación en dos lugares y el paso de fechas calcula su propio mínimo. No cambiar únicamente la constante.
- `events` aprobados son inmutables para propietarios. No relajar esa política para guardar reportes.
- Los valores reales de configuración de Google no se conocen. Coordinación tiene acceso y puede aportarlos/instalarlos. La tarea 8 define cómo obtenerlos y validar la conexión; no simularlos en producción.
- El usuario facilitó acceso para cambios en Supabase durante ejecución. No copiar credenciales de conversación a código, documentación, fixtures o argumentos que se impriman. Confirmar el proyecto de destino por URL/configuración existente antes de aplicar migraciones.
- Este documento es planificación. No se aplicaron migraciones ni cambios de producto al redactarlo.

Comenzar ejecución leyendo AGENTS.md, estado de git y el skill de worktrees. Crear una rama de implementación `codex/event-reports-checklist` desde la rama que contiene este plan, usando aislamiento si corresponde. No revertir cambios del usuario.

## Mapa de archivos

| Unidad | Archivos principales |
|---|---|
| Calendario | `lib/business-days.ts`, `lib/workflow.ts`, wizard, migración 003 |
| Reporte y permisos | `lib/event-report.ts`, `lib/types.ts`, `lib/event-mapper.ts`, `lib/supabase-reports.ts`, migración 004 |
| Captura del reporte | `app/events/[id]/report/page.tsx`, `components/events/report/*` |
| Sincronización | `integrations/google-attendance/*.gs`, `lib/attendance.ts`, migración 005 |
| QR y participantes | `components/events/attendance-panel.tsx`, `lib/supabase-attendance.ts`, plantilla imprimible |
| Checklist | `lib/event-progress.ts`, `lib/supabase-progress.ts`, componentes workflow, dashboard |
| Estadísticas | `lib/report-analytics.ts`, `lib/csv.ts`, `components/admin/report-analytics.tsx`, analíticas existentes |
| Guía de operación | `docs/GOOGLE_ATTENDANCE_SETUP.md`, documentación existente |

No separar en archivos vacíos por cumplir esta tabla: cada archivo tiene la responsabilidad descrita en su tarea. Agregar tipos al archivo central y mapeos al mapper existente.

## Contratos compartidos

Definir estos tipos en `lib/types.ts` durante tarea 2; usar exactamente estos nombres en tareas posteriores:

```ts
export type ReportStatus = "draft" | "submitted"
export type ParticipationMode = "none" | "listed" | null
export type AttendeeCategory = "docente" | "alumno" | "comunidad" | null
export interface TeacherOrganizer { name: string; degree: string }
export interface StudentOrganizer {
  name: string
  level: "licenciatura" | "maestria" | "otro_posgrado"
}
export interface ReportValues {
  email: string
  teacherCount: number | null
  studentCount: number | null
  communityCount: number | null
  teacherMode: ParticipationMode
  teachers: TeacherOrganizer[]
  studentMode: ParticipationMode
  students: StudentOrganizer[]
  attendanceListUrl: string
  photoUrls: string[]
  narrative: string
}
export interface EventReport extends ReportValues {
  eventId: string
  eventName: string
  status: ReportStatus
  version: number
  firstSubmittedAt: string | null
  submittedAt: string | null
  updatedAt: string
  attendanceBasis: "list" | "google" | null
  verifiedResponseCount: number | null
  verifiedSnapshotAt: string | null
}
export interface AttendanceSummary {
  eventId: string
  state: "unconfigured" | "unverified" | "fresh" | "stale"
  responseCount: number | null
  lastSyncedAt: string | null
}
export interface AttendanceResponse {
  eventId: string
  sourceResponseId: string
  submittedAt: string
  name: string
  email: string | null
  category: AttendeeCategory
}
export interface PreparationValues {
  reservationDone: boolean
  diffusionDone: boolean
  qrShared: boolean
}
export interface WorkflowSettings {
  reportsRolloutAt: string | null
  attendancePublishedUrl: string | null
  attendancePrefillTemplate: string | null
  attendanceEnabled: boolean
}
export type EventProgress =
  | { state: "unavailable" }
  | {
      state: "loaded"
      report: Pick<EventReport, "status" | "version" | "submittedAt" | "firstSubmittedAt" | "attendanceBasis"> | null
      preparation: PreparationValues
      attendance: AttendanceSummary
      tracking: "current" | "legacy"
    }
```

### Task 1: Cambiar la anticipación a cinco días hábiles

**Files:** Create `lib/business-days.ts`, `tests/business-days.test.ts`, `vitest.config.ts`, `migrations/003_registration_business_days.sql`, `tests/database/registration-business-days.sql`, `scripts/test-database.mjs`. Modify `package.json`, lockfile, `lib/workflow.ts`, `components/events/event-wizard.tsx`, `components/events/wizard-steps/event-data-step.tsx`, `app/events/new/page.tsx`, `schema.sql`, `docs/ARCHITECTURE.md`, `docs/COMPONENTS.md`.

**Interfaces:**

```ts
// now es un instante; startLocal es una cadena datetime-local de Tijuana.
export const MIN_LEAD_BUSINESS_DAYS = 5
export function earliestEventLocalDate(now: Date): string // YYYY-MM-DD
export function meetsRegistrationLead(startLocal: string, now: Date): boolean
export function latestRegistrationLocalDate(startLocalDate: string): string
```

- [ ] **Preparar pruebas de comportamiento.** Instalar `npm install --save-dev vitest`, añadir `"test": "vitest run"`, alias `@` mediante `fileURLToPath(new URL('.', import.meta.url))` en `vitest.config.ts`. Verificar compatibilidad con la versión de Node instalada antes de aceptar el lockfile. Usar entorno node; no añadir un stack de pruebas de componentes para esta regla.

```ts
import { describe, expect, it } from "vitest"
import { earliestEventLocalDate, meetsRegistrationLead, latestRegistrationLocalDate } from "@/lib/business-days"

describe("registro en días hábiles de Tijuana", () => {
  it.each([
    ["2026-09-21T19:00:00Z", "2026-09-28"],
    ["2026-09-25T19:00:00Z", "2026-10-02"],
    ["2026-09-26T19:00:00Z", "2026-10-02"],
    ["2026-03-06T20:00:00Z", "2026-03-13"],
    ["2026-09-26T02:00:00Z", "2026-10-02"],
  ])("%s permite desde %s", (now, expected) => {
    expect(earliestEventLocalDate(new Date(now))).toBe(expected)
  })
  it("acepta el límite a medianoche y rechaza el día anterior", () => {
    const now = new Date("2026-09-21T19:00:00Z")
    expect(meetsRegistrationLead("2026-09-28T00:00", now)).toBe(true)
    expect(meetsRegistrationLead("2026-09-27T23:59", now)).toBe(false)
    expect(meetsRegistrationLead("", now)).toBe(false)
  })
  it("calcula un plazo inverso coherente para eventos en fin de semana", () => {
    expect(latestRegistrationLocalDate("2026-10-03")).toBe("2026-09-27")
  })
})
```

- [ ] **Ejecutar rojo.** `npm test -- tests/business-days.test.ts`; debe fallar por módulo/funciones aún inexistentes.
- [ ] **Implementar una sola regla civil.** Extraer YYYY-MM-DD en Tijuana con `Intl.DateTimeFormat(...).formatToParts`. Operar las fechas civiles con `Date.UTC` y `getUTCDay`, únicamente como aritmética de calendario. No interpretar `datetime-local` con `new Date(localString)`. Validar que la fecha exista, no solo que coincida con regex. Avanzar desde mañana hasta contar cinco días de lunes a viernes. Para plazo inverso recorrer desde la fecha del evento hacia atrás: contar el día del cursor cuando sea hábil, restar un día, detener al llegar a cinco; el cursor final es la última fecha de registro. Así los fines de semana no producen una regla inversa contradictoria.

```ts
// Dentro de earliestEventLocalDate, después de convertir hoy a fecha civil UTC:
let counted = 0
while (counted < MIN_LEAD_BUSINESS_DAYS) {
  cursor.setUTCDate(cursor.getUTCDate() + 1)
  const weekday = cursor.getUTCDay()
  if (weekday !== 0 && weekday !== 6) counted += 1
}
return cursor.toISOString().slice(0, 10)
```

- [ ] **Usar la regla en todos los puntos.** Sustituir `MIN_LEAD_DAYS` por `MIN_LEAD_BUSINESS_DAYS` (reexportar desde workflow si reduce cambios). Zod, blockedReason y belowMinLead deben llamar `meetsRegistrationLead`. `min` del input es `earliestEventLocalDate(now) + 'T00:00'`. Revalidar con hora actual al intentar avanzar/enviar; el mínimo visible se actualiza al enfocar el campo. `registrationDeadline` usa el inverso y devuelve fin del día de Tijuana. Cambiar texto a «Registra tu evento con al menos 5 días hábiles de anticipación (lunes a viernes)». No cambiar las referencias al plazo de evidencias.
- [ ] **Enforcement DB.** Migración 003 agrega `public.earliest_event_date(p_today date) returns date` con la misma regla y un trigger BEFORE INSERT OR UPDATE. En INSERT validar la fecha local de `start_date`; en UPDATE solo validar si `NEW.status='en_revision'` y cambia `start_date` o `OLD.status='rechazado'`. La resolución admin a aprobado/rechazado y actualizaciones de otras columnas no deben fallar por proximidad. Error español y SQLSTATE `22023`. Sin modificar políticas existentes.
- [ ] **Probar DB aislada.** `scripts/test-database.mjs` valida que `FMP_TEST_DATABASE_URL` sea localhost/127.0.0.1/::1, ejecuta psql con argumentos separados y `ON_ERROR_STOP=1`, sin imprimir URL. Archivo SQL envuelto en BEGIN/ROLLBACK, DO blocks que hacen RAISE EXCEPTION ante diferencias; deben probar la función con las cinco fechas de arriba, el trigger al insertar/reagendar, y aprobación cerca del evento. Usar una Supabase local o instancia de pruebas local con schema de la app, nunca producción. Si no está disponible, informar que falta la prueba de DB y no declarar lista la migración para producción.
- [ ] **Verificar y documentar.** `npm test -- tests/business-days.test.ts`, repetir con `TZ=UTC` y `TZ=Asia/Tokyo`, ejecutar prueba SQL local, `npx tsc --noEmit`, `npm run lint`, `npm run build`. Buscar referencias antiguas con `rg -n 'MIN_LEAD_DAYS|21.day lead|tres semanas de anticipación|21 días.*anticipación' app components lib docs` y actualizar documentación de producto; no reescribir registros históricos ni el contexto de este plan.
- [ ] **Commit y push:** `git commit -m "feat: require five business days for event registration"`, luego `git push -u origin codex/event-reports-checklist` en primer push (o `git push` si ya tiene upstream).

### Task 2: Persistir reportes, preparación y reglas de autorización

**Files:** Create `migrations/004_event_reporting.sql`, `lib/event-report.ts`, `lib/supabase-reports.ts`, `lib/supabase-progress.ts`, `tests/event-report.test.ts`, `tests/database/event-reports.sql`. Modify `lib/types.ts`, `lib/event-mapper.ts`, `schema.sql`, `docs/DATABASE.md`.

**Interfaces:** Tipos del bloque compartido; `emptyReportValues(email: string): ReportValues`, `reportDraftSchema`, `reportSubmissionSchema`, `countReportWords(text: string): number`, `canWaiveAttendanceList(summary: AttendanceSummary, now: Date): boolean`; servicio `getEventReport(eventId: string): Promise<EventReport | null>`, `saveEventReport(eventId: string, values: ReportValues, mode: 'draft' | 'submit', expectedVersion: number): Promise<EventReport>`. Versión esperada 0 significa crear. En `lib/supabase-progress.ts` crear `saveEventPreparation(eventId: string, values: PreparationValues): Promise<PreparationValues>` y `getWorkflowSettings(): Promise<WorkflowSettings>` para uso de tareas 3–6.

- [ ] **Pruebas rojas de validación.** Escribir `tests/event-report.test.ts` con conteos vacíos/0/negativos/decimales, 250/251 palabras, espacios Unicode, URL https frente a javascript/http, participación none/listed sin nombres, borrador parcial y mayúsculas con acentos.

```ts
it("no confunde un conteo sin contestar con cero", () => {
  const values = emptyReportValues("organizador@example.test")
  values.teacherCount = 0
  expect(reportDraftSchema.safeParse(values).success).toBe(true)
  expect(reportSubmissionSchema.safeParse(values).success).toBe(false)
})
it("no exenta una sincronización vieja", () => {
  const summary: AttendanceSummary = {
    eventId: "00000000-0000-4000-8000-000000000001",
    state: "fresh", responseCount: 4, lastSyncedAt: "2026-09-23T10:00:00Z",
  }
  expect(canWaiveAttendanceList(summary, new Date("2026-09-23T11:00:01Z"))).toBe(false)
})
```

- [ ] **Crear tablas y permisos.** En 004 crear `event_reports` (PK/FK event_id, campos snake_case del contrato), `event_preparation` (PK/FK event_id y booleanos por defecto false), `attendance_responses` (unique source_form_id/source_response_id), `attendance_sync_state` (PK event_id, snapshot_started_at, last_synced_at, response_count), `workflow_settings` (singleton), y schema/tabla privada `private.attendance_integrations` (source_form_id, signing_secret, enabled). Se crean las tablas de asistencia ahora para que la exención tenga un contrato real desde el primer envío; no se habilita ingestión hasta tarea 4.
  `workflow_settings.reports_rollout_at` empieza null (función aún inactiva); el runbook la establece en activación. Attendance config pública solo contiene URL/plantilla. Tabla privada sin grants a PUBLIC/anon/authenticated; revocar USAGE en schema privado. RLS para tablas públicas: SELECT solo propietario/admin mediante FK a events; settings SELECT authenticated/admin UPDATE. Denegar INSERT/UPDATE/DELETE directos de reports, preparation y attendance a clientes: escribir por RPCs acotadas. Estado inicial sync inexistente es sin verificar, nunca cero.
  Agregar `public.get_workflow_settings()` con EXECUTE solo authenticated y comprobación de auth.uid no nulo; retorna únicamente configuración pública y `attendance_enabled` derivado de si hay una integración privada habilitada (una sola fuente activa en v1). Nunca retorna secreto ni IDs privados. Usar SECURITY DEFINER con search_path fijo para esa única lectura acotada. `getWorkflowSettings` llama esa RPC; no expone la tabla privada. Un estado de asistencia se considera unconfigured cuando la integración está deshabilitada o faltan URLs configuradas; save_event_report también exige fuente habilitada para exentar, aunque exista un snapshot reciente.
- [ ] **RPC atómica de reporte.** Implementar `public.save_event_report(p_event_id uuid, p_values jsonb, p_mode text, p_expected_version integer) returns public.event_reports` como SECURITY DEFINER con search_path fijo y referencias cualificadas. Revocar EXECUTE a PUBLIC/anon; conceder solo authenticated. Validar `auth.uid()` propietario y evento aprobado, adquirir lock del evento y reporte, comparar versión, validar claves/tipos/límites antes de persistir. Derivar eventName en mayúsculas de events, nunca del cliente. Draft acepta campos sin contestar y no puede sobrescribir un submitted. Submit exige evento finalizado y todos los campos del spec; si falta URL de lista, comprobar un snapshot ≤60 min y count>0 en la misma transacción. Snapshot y lista proporcionados: preferir basis=list para que esa entrega no dependa de conexión. Estampar `attendance_basis`, `verified_response_count`, `verified_snapshot_at` exclusivamente en DB. Guardar `first_submitted_at` solo una vez; cada envío válido actualiza `submitted_at`; `version=version+1`. Conflicto usa SQLSTATE `40001`; cliente conserva valores y muestra «El reporte cambió en otra sesión. Recarga antes de guardar».
  Validar enteros 0..1,000,000, email ≤254, reseña ≤250 tokens no vacíos separados por whitespace, hasta 100 organizadores por grupo, nombre ≤250, grado ≤100, enlaces ≤2048 y fotos ≤10. `none` exige array vacío; `listed` exige al menos una fila completa. Normalizar trim, convertir reseña y nombre de evento a mayúsculas. No exigir fotografías. Ninguna RPC recibe status/version/fechas/basis elegidos libremente por el cliente.
  Probar espacios no separables y saltos de línea tanto en JS como SQL para que ambos cuenten palabras igual. Cuando se evalúa exención, leer sync_state con lock compartido; guardar count/fecha de esa misma fila en el reporte. La fuente que produjo el snapshot debe coincidir con la integración activa.
- [ ] **RPC de preparación.** `public.save_event_preparation(p_event_id uuid, p_values jsonb) returns public.event_preparation`; propietario autenticado de evento aprobado, solo tres booleanos del contrato, upsert completo atómico, ninguna actualización a events. Usar el mismo patrón de grants/search_path.
- [ ] **Implementar schemas y mapper.** `reportDraftSchema` valida límites y formas, tolera campos faltantes representados según contrato; `reportSubmissionSchema` exige respuestas completas pero la asistencia se valida contra el summary aparte y autoritativamente en RPC. `countReportWords` usa trim + split Unicode whitespace. `dbRowToEventReport`, `reportValuesToDbJson`, `dbRowToAttendanceSummary`, `dbRowToAttendanceResponse`, `dbRowToPreparation`, `dbRowToWorkflowSettings` viven en event-mapper. `saveEventReport` transforma a snake_case, llama RPC y traduce conflictos/errores sin descartar el formulario. No emitir correo mediante la API genérica existente.
- [ ] **SQL de seguridad real.** Preparar dos propietarios, un admin y eventos aprobados distintos dentro de transacción. Usar `SET LOCAL ROLE authenticated` y claims JWT locales para probar que A no puede leer/escribir reporte o participantes de B; admin puede leer pero no suplantar al propietario en RPC; anon no puede leer ni guardar. Probar escritura directa de basis/count/status y acceso a secreto fallan. Probar doble creación version=0, actualización con versión vieja, draft sobre submitted, submit antes del fin, caso tardío, lista faltante con snapshot nulo/viejo/0 y caso positivo fresco. Restaurar rol para fixtures, no conceder permisos amplios para pasar pruebas.

```sql
-- Patrón de aserción: una falla SQL realmente termina psql con exit != 0.
DO $$ BEGIN
  IF public.earliest_event_date(DATE '2026-09-25') <> DATE '2026-10-02' THEN
    RAISE EXCEPTION 'calendar contract violated';
  END IF;
END $$;
-- Para una llamada prohibida: capturar solo el SQLSTATE esperado; si retorna,
-- lanzar un SQLSTATE distinto (P0001), que NO debe ser tragado por el handler.
```

- [ ] **Verificación y commit.** Ejecutar pruebas unitarias y SQL locales, typecheck/build, revisar schema.sql sin claves. Commit `feat: store final event reports with protected submission rules`; push.

### Task 3: Captura, corrección y lectura del reporte en la plataforma

**Files:** Create `app/events/[id]/report/page.tsx`, `components/events/report/event-report-form.tsx`, `components/events/report/report-organizers.tsx`, `components/events/report/report-evidence.tsx`, `components/events/report/report-receipt.tsx`. Modify `app/events/[id]/page.tsx`, `components/admin/admin-event-review-drawer.tsx`. Tests: ampliar `tests/event-report.test.ts` para payload de corrección.

**Interfaces:** `EventReportForm({ event, report, attendance, onSaved })`; usar `getEventReport/saveEventReport` de tarea 2. Props tipadas con contratos centrales. `onSaved(report: EventReport): void`. El lector de summary usa provisionalmente `getAttendanceSummary(eventId)` de tarea 4; para que esta tarea compile, crear esa función de lectura aquí en `lib/supabase-attendance.ts` usando la tabla de tarea 2, y dejar ingestión/configuración para 4.

- [ ] **Probar separación draft/submit.** Caso: guardado parcial retorna draft; envío retorna submitted con timestamp; después editar y guardar con mode=draft se rechaza; corrección enviada con nueva versión mantiene firstSubmittedAt. Verificar en DB de tarea 2 y como integración manual con dos pestañas.
- [ ] **Construir formulario en tres secciones.** Usar RHF + Zod y `useFieldArray` para arrays de objetos de organizadores. Para photoUrls (string[]) usar inputs repetidos controlados con setValue; RHF useFieldArray no admite arrays planos de strings. Inputs numéricos traducen `''` a null (no `Number('')`); radios sin respuesta por defecto para participación. Mostrar ID/nombre derivados como solo lectura y correo precargado. Counter 250 y transformación a mayúsculas al blur/guardar, sin mover el cursor en cada pulsación. Campos foto/lista son URL con texto de ayuda sobre acceso de coordinación. Lista alternativa disponible aun con exención; indicar razón cuando no sea obligatoria.

```tsx
// Conversión de input; mantener el cero explícito.
onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
// El envío debe esperar éxito de la base antes de mostrar recibido:
const saved = await saveEventReport(event.id, values, "submit", report?.version ?? 0)
onSaved(saved)
```

- [ ] **Guardar y entregar.** Botón Guardar borrador solo antes del primer envío; botón Enviar reporte o Guardar correcciones abre revisión y llama RPC. Deshabilitar durante solicitud, conservar campos ante error/red y advertir salida sin guardar. Mostrar última fecha solo tras éxito. Reintento después de respuesta de red incierta: releer reporte y versión; no volver a crear ciegamente. Antes del fin se permite guardar borrador y se explica cuándo se habilita envío; tras plazo permitir y marcar tardío. Propietario puede corregir con envío completo; admin ve receipt y enlaces sin botones de edición.
- [ ] **Recibo y acceso.** Con submitted mostrar fecha inicial y última corrección, total, lista o fundamento Google, enlaces y texto «La recepción del reporte no significa que las constancias estén emitidas». CSS print del receipt oculta navegación/botones. Agregar enlace al reporte en detalle y drawer admin, evitando copiar el formulario en ambos. Reemplazar CTA externo de evidencias para eventos del nuevo flujo en tarea 6.
- [ ] **Verificar en navegador.** Probar teléfono 390px y desktop, teclado, carga/borrador reabierto, errores 251 palabras, conteos 0, evento de otro usuario, vuelta al detalle, print preview y conflicto en dos pestañas. No enviar pruebas a producción ni al Form institucional sin evento de prueba acordado. Typecheck/lint/build. Commit `feat: add the in-app final event report`; push.

### Task 4: Sincronizar respuestas verificables desde Google

**Files:** Create `migrations/005_google_attendance_sync.sql`, `integrations/google-attendance/Code.gs`, `integrations/google-attendance/appsscript.json`, `lib/attendance.ts`, `tests/attendance.test.ts`, `tests/database/attendance-sync.sql`, `tests/google-attendance.test.ts`. Modify `lib/supabase-attendance.ts`, mapper/types si requieren solo formas auxiliares, `schema.sql`, `docs/DATABASE.md`.

**Interfaces:**

```ts
export function getAttendanceSummary(eventId: string): Promise<AttendanceSummary>
export function getAttendancePage(eventId: string, cursor?: string): Promise<{
  responses: AttendanceResponse[]; nextCursor: string | null
}>
// RPC de fuente externa: p_body es texto JSON exacto; no reserializar al firmar.
// attendance_sync(p_body text, p_sent_at bigint, p_signature text) returns jsonb
// Bodies v1:
type SyncBody =
  | { version: 1; action: "targets"; sourceFormId: string; afterEventId: string | null }
  | { version: 1; action: "snapshot"; sourceFormId: string; eventId: string;
      snapshotStartedAt: string; responses: Array<{
        sourceResponseId: string; submittedAt: string; name: string;
        email: string | null; category: AttendeeCategory
      }> }
```

- [ ] **Tests rojos.** En Node, cargar Code.gs en `node:vm` con mocks de FormApp/Utilities/UrlFetchApp/PropertiesService/LockService. Probar una respuesta, campos opcionales ausentes, IDs de pregunta no configurados, dos respuestas distintas con mismo correo, reintento de mismo snapshot y eliminación de respuesta en siguiente lectura completa. SQL cubre firma alterada/vieja, origen deshabilitado, eventos inexistentes/no aprobados, un snapshot viejo llegando después del nuevo, y cero respuestas posterior a uno positivo.
- [ ] **RPC firmada y acotada.** Habilitar pgcrypto en el schema de extensiones existente; verificar su ubicación sin asumir public. Función con permisos de EXECUTE anon/authenticated pero validación HMAC antes de consultar destinos o escribir. `p_sent_at` segundos Unix, tolerancia absoluta 300s. Firma hex de HMAC SHA-256 de UTF-8 `p_sent_at + '.' + p_body`; comparar contra secreto del source_form_id privado habilitado. Límite p_body 2 MiB, máximo 5,000 respuestas por evento y límites de texto del contrato; rechazar completo si excede. No truncar. Body version=1 y acción explícita, ninguna SQL dinámica.

```sql
-- Primitiva criptográfica; usar el schema real de pgcrypto al implementarla.
encode(extensions.hmac(
  convert_to(p_sent_at::text || '.' || p_body, 'UTF8'),
  convert_to(v_signing_secret, 'UTF8'), 'sha256'
), 'hex')
```

  Acción targets devuelve solo `{events:[{eventId}], nextCursor}` para aprobados, orden por UUID, páginas de 500. Acción snapshot valida estructura, timestamps no futuros y UUID de evento aprobado, bloquea estado de sincronización del evento y rechaza snapshots anteriores al actual; misma fecha + mismo contenido devuelve éxito idempotente, misma fecha + contenido diferente rechaza. Mantener hash del snapshot en sync_state. Validar sourceResponseId único en payload; un ID no puede pertenecer simultáneamente a dos eventos. Bajo lock por source_form_id, permitir moverlo al evento correcto al reconciliar una respuesta editada, actualizando también conteo del evento de origen. Reemplazar únicamente respuestas del origen/evento del snapshot en una transacción y estampar count real + last_synced_at. Snapshot vacío válido borra las respuestas anteriores de ese evento. RPC no devuelve datos personales. Un reintento de snapshot ya aceptado no rejuvenece last_synced_at artificialmente.
  La migración 005 agrega `private.attendance_response_versions` con PK (source_form_id, source_response_id), snapshot_started_at y event_id nullable. Mantiene una marca temporal incluso al eliminar una respuesta (event_id=null): un snapshot anterior a su último movimiento/eliminación no puede restaurarla en un evento antiguo. Sin grants a clientes; solo la RPC actualiza esta tabla, bajo el mismo lock de fuente. Probar este caso cruzado en SQL, no solamente snapshots viejos del mismo evento. Rechazar snapshotStartedAt con más de 60 minutos de antigüedad antes de actualizar last_synced_at; sincronizaciones grandes que excedan esa ventana quedan sin verificar.
- [ ] **Script operativo.** Funciones `inspectFormConfiguration()`, `syncAttendance()`, `installSyncTrigger()` y helpers puros para normalizar/firmar. Properties requeridas: FMP_FORM_ID (ID de edición), FMP_EVENT_ITEM_ID, FMP_NAME_ITEM_ID, FMP_SUPABASE_URL, FMP_SUPABASE_ANON_KEY, FMP_SYNC_SECRET. Opcionales FMP_EMAIL_ITEM_ID/FMP_CATEGORY_ITEM_ID y mapa JSON explícito de opciones reales → categorías. La inspección solo muestra IDs/títulos/tipos y URL precargada de ejemplo usando `createResponse().withItemResponse(...).toPrefilledUrl()`; **no llama submit()**. No asumir que item.getId es el entry.ID público. Las propiedades se validan antes de consultar/reescribir snapshots.

```js
function signatureFor(body, sentAt, secret) {
  return Utilities.computeHmacSha256Signature(sentAt + '.' + body, secret)
    .map(function (n) { return ((n + 256) % 256).toString(16).padStart(2, '0'); })
    .join('');
}
// POST HTTPS a /rest/v1/rpc/attendance_sync, Content-Type application/json,
// apikey y Authorization Bearer con la anon key; body {p_body,p_sent_at,p_signature}.
```

  `syncAttendance` usa ScriptLock para impedir solapamiento; guarda startedAt antes de `form.getResponses()`, exige lectura completa y estructura válida, obtiene todos los destinos paginados, agrupa respuestas por UUID exacto y envía snapshot para cada destino incluso si quedó vacío. Si falla la lectura global, no enviar snapshots vacíos. Respuestas individuales antiguas sin ID/UUID inválido se omiten y cuentan en un aviso agregado para coordinación; no registrar nombres/correos. Una configuración inválida de campo requerido aborta todo y conserva snapshots previos. Categoría opcional desconocida=null. Normalizar getRespondentEmail si no hay campo email configurado; nunca exigir que exista.
  Reintentar HTTP 429/5xx hasta tres veces con espera 1/2/4s y firma/timestamp nuevos; no reintentar 4xx de validación. Si se agota, mantener los snapshots válidos previos de los eventos restantes y registrar fallo agregado; la UI los marcará viejos. No marcar última sincronización general exitosa por un intento parcial. Verificar runtime/cuotas con volumen real durante activación; si supera límites, conservar fallback lista y no habilitar verificación como si todo estuviera sincronizado.
  `installSyncTrigger` instala un único time-driven trigger cada 15 minutos para la función bajo la cuenta de coordinación; no borrar triggers de otras funciones. No implementar un segundo trigger on-submit en esta fase.
- [ ] **Lectura con RLS.** `getAttendanceSummary` distingue unconfigured, unverified y snapshot fresco/viejo comparando con Date.now; errores de consulta lanzan error y no se convierten a count=0. `getAttendancePage` usa cursor source_response_id y límite 200. Propietario/admin pueden consultar datos bajo RLS; ningún enlace QR contiene credenciales. La decisión final de exención sigue en DB.
- [ ] **Verificar y entregar unidad.** Ejecutar suites JS/SQL y comprobar paridad HMAC Node/Apps Script/pgcrypto con una cadena UTF-8 que contenga «José». Probar 1,201 respuestas sin pérdida, snapshot vacío, cambio de evento de una respuesta y corte de red a mitad de destinos. Commit `feat: verify attendance through signed Google Forms snapshots`; push.

### Task 5: QR por evento, participantes y lista alternativa

**Files:** Create `components/events/attendance-panel.tsx`, `app/events/[id]/attendance-list/page.tsx`, `tests/attendance-links.test.ts`. Modify `lib/attendance.ts`, `lib/supabase-attendance.ts`, `package.json`, lockfile, `app/events/[id]/page.tsx`.

**Interfaces:** `buildAttendanceLink(settings: WorkflowSettings, eventId: string): string | null`; `AttendancePanel({ event, summary, settings })`; `getAttendancePage` de tarea 4. Plantilla guardada contiene exactamente `{eventId}` como valor de la pregunta ID; opcional `{eventName}` solo si se configura explícitamente como segundo campo y se amplía firma con name, no añadirlo por inferencia.

- [ ] **Pruebas del enlace.** Config sin plantilla devuelve null, UUID inválido se rechaza, host no Google se rechaza, placeholder en ruta/host se rechaza, debe estar en un query param entry.NUMERO y existir exactamente una vez. URL final HTTPS de docs.google.com bajo `/forms/d/e/.../viewform`; parámetros ajenos de seguimiento/cuenta no se preservan. Comparar URL resultante contra un ejemplo precargado obtenido por inspección de Google, no un entry.ID imaginado. Datos personales no entran al enlace.

```ts
expect(buildAttendanceLink({
  reportsRolloutAt: null, attendancePublishedUrl: null,
  attendancePrefillTemplate: null, attendanceEnabled: false,
}, "00000000-0000-4000-8000-000000000001")).toBeNull()
```

- [ ] **Tarjeta QR.** Instalar `qrcode` y sus tipos. Usar API local `toCanvas`/`toDataURL`, contraste negro/blanco con quiet zone, enlace accesible debajo, PNG a resolución suficiente (mínimo 800px). Tarjeta incluye nombre del evento y texto del spec; botones Descargar QR, Copiar enlace, Copiar instrucciones e Imprimir cartel. Incluir título/instrucción en cartel imprimible; PNG puede ser QR solo con nombre identificable de archivo. Copiar muestra éxito solo si clipboard.writeText resuelve; si falla, seleccionar enlace visible. QR ausente/config error muestra explicación y contacto de coordinación, no QR genérico engañoso.
- [ ] **Asistencia y alternativa.** Mostrar número de respuestas, fecha de última sincronización y aviso de posible demora de 15 minutos. Botón Actualizar consulta la base (no promete ejecutar Google al instante). Tabla paginada de participantes para propietario/admin, opcionales con «No capturado», exportación completa en tarea 7. Enlace a plantilla imprimible autenticada, con nombre/ID evento y columnas nombre/categoría/firma, 20 filas por hoja; no contiene datos de otros eventos. Completar la tarea manual «Ya compartí el registro» usa preparación, no sync_state.
- [ ] **Comprobar visualmente.** Escanear QR desde un móvil real y verificar ID precargado; no enviar asistencia institucional sin evento de prueba. Probar 390px, teclado, enlace alternativo, PNG y print preview. La comprobación real puede completarse con Form de pruebas antes de coordinación. Commit `feat: guide organizers through participant registration and QR sharing`; push.

### Task 6: Checklist persistente y siguiente paso consistente

**Files:** Create `lib/event-progress.ts`, `components/workflow/event-checklist.tsx`, `tests/event-progress.test.ts`. Modify `lib/supabase-progress.ts`, `lib/workflow.ts`, `components/workflow/event-next-steps.tsx`, `components/workflow/process-guide.tsx`, `components/events/event-card.tsx`, `app/dashboard/page.tsx`, `app/events/[id]/page.tsx`, `schema.sql`; add `migrations/006_event_progress_reads.sql` si se usa RPC para el resumen agrupado.

**Interfaces:**

```ts
export function getEventProgress(eventIds: string[]): Promise<Record<string, EventProgress>>
export function saveEventPreparation(eventId: string, values: PreparationValues): Promise<PreparationValues>
export function isPendingReport(event: Event, progress: EventProgress, now: Date): boolean | null
export function buildEventChecklist(event: Event, progress: EventProgress, now: Date): ChecklistItem[]
// En lib/event-progress.ts:
export interface ChecklistItem {
  id: "registration" | "approval" | "preparation" | "attendance" | "report"
  state: "pending" | "active" | "done" | "unverified"
  title: string
  detail: string
  source: "system" | "organizer" | null
  href?: string
}
// Mantener segundo parámetro now para llamadas actuales:
// nextStepFor(event: Event, now = new Date(), progress?: EventProgress): EventNextStep
```

- [ ] **Tests rojos de estado.** Fixture aprobado terminado sin reporte de la cohorte actual→pendiente; enviado→no pendiente y tono done; histórico anterior a rollout→legacy/sin seguimiento; error de carga→null, no false; rechazado→corregir solicitud antes de cualquier reporte; QR compartido sin respuestas→no verificado; lista en reporte enviado→evidencia satisfecha; reserva no aplica a En línea. Pruebas en el día 21 de evidencia y después usando Tijuana, incluida transición DST.

```ts
it("no presenta ausencia de datos como ausencia de pendientes", () => {
  expect(isPendingReport(approvedEndedEvent, { state: "unavailable" }, now)).toBeNull()
})
// Fixtures approvedEndedEvent y now se definen en este mismo archivo con
// campos completos del tipo Event; no dependan de registros de producción.
```

- [ ] **Consulta agrupada con autorización.** Implementar lectura de report summaries/preparation/sync/settings en lotes de máximo 200 IDs bajo sesión/RLS, o RPC SECURITY INVOKER que conserve RLS; no SECURITY DEFINER abierto que acepte IDs ajenos. Para cada evento cargado obtener estado loaded con valores manuales false por ausencia de fila. Si falla una consulta necesaria marcar unavailable, no un loaded inventado. Reporte legacy si fin<rollout y no hay reporte; rollout=null significa seguimiento aún inactivo. La UI mantiene solicitudes/revisión disponibles si el seguimiento aún no está activado.
- [ ] **Reglas comunes.** `isPendingReport` requiere aprobado, finalizado, tracking=current y report.status distinto de submitted. `buildEventChecklist` devuelve estados y fuente del spec. Con desconocido, siguiente paso muestra «No pudimos consultar el seguimiento» y reintento. Tras envío devuelve «Reporte recibido» y enlace interno. Mantener período de evidencia de 21 días civiles inclusive, con fin de día local; ajustar helpers usados por estos avisos para evitar suma de milisegundos cruzando DST.
- [ ] **Acciones internas y externas.** Agregar a `EventNextStep.actions` discriminador `kind: 'internal' | 'external'`. Actualizar todos los productores y consumidores: Link de Next para reporte/checklist; anchor target=_blank solo para Google/reservas/plantillas externas. No seguir usando window.open para todo. En detalle, checklist por encima de la ficha; paso activo expandido, completados colapsables, contadores solo para acciones requeridas aplicables. Preparación opcional y QR compartido nunca bloquean reporte.
- [ ] **Integrar dashboard.** Cargar progreso por lote tras eventos, pasar summary a EventCard y nextStepFor, refrescar al volver de reporte y tras guardado. Mostrar «Consultando…»/«No disponible» si no se puede calcular pendientes; no usar cero como fallback. La guía de seis fases usa texto claro de participantes, reporte propio y 5 días hábiles. Quitar «Sin lista no hay constancias» y reemplazar por «Registra la asistencia con el formulario para participantes o conserva una lista alternativa». Históricos conservan consulta del enlace anterior con etiqueta explícita.
- [ ] **Pruebas y revisión visual.** Ejecutar estados unitarios; probar usuario con mezcla de legado, nuevo, draft, submitted, rechazado, y falla de red. En móvil el CTA no queda escondido detrás de guía extensa; no repetir cuatro botones primarios. Validar teclado y etiquetas de confirmación manual. Commit `feat: show a persistent event checklist and accurate pending reports`; push.

### Task 7: Estadísticas y descargas de reportes y participantes

**Files:** Create `lib/report-analytics.ts`, `lib/csv.ts`, `components/admin/report-analytics.tsx`, `tests/report-analytics.test.ts`, `tests/csv.test.ts`. Modify `app/admin/analytics/page.tsx`, `lib/supabase-reports.ts`, `lib/supabase-attendance.ts`, `lib/semester.ts`, `components/events/report/report-receipt.tsx`, `components/events/attendance-panel.tsx`.

**Interfaces:**

```ts
export interface ReportFilters { semester?: string; program?: Event["program"]; eventId?: string }
export interface ReportAnalyticsRow { event: Event; report: EventReport | null; progress: EventProgress }
export function getReportAnalyticsRows(filters: ReportFilters): Promise<ReportAnalyticsRow[]>
export function summarizeReports(rows: ReportAnalyticsRow[], now: Date): {
  reportedEvents: number; pendingEvents: number; lateEvents: number;
  teacherCount: number; studentCount: number; communityCount: number;
  totalAttendance: number; meanAttendance: number | null
}
export function createCsv(rows: Array<Array<string | number | null>>): string
export function downloadCsv(contents: string, filename: string): void
export function getAllAttendanceResponses(eventId: string): Promise<AttendanceResponse[]>
```

- [ ] **Tests de agregación/exportación.** Borrador excluido de asistencia; corrección cuenta una sola fila; participantes electrónicos nunca suman al total declarado; 0 reportes→promedio null; legado no pendiente; filtros de semestre/programa/evento también filtran CSV; 1,201 eventos/respuestas completos. Definir semestre por inicio del evento en Tijuana: `2026-07-01T01:00:00Z` pertenece a 2026-1. Revisar `lib/semester.ts`, que hoy toma prefijo UTC; corregir esa extracción compartida y actualizar comentario y pruebas sin cambiar el inicio julio/enero.

```ts
it("genera CSV seguro y legible en Excel", () => {
  const csv = createCsv([["Nombre", "Reseña"], ["=1+1", 'José, dijo "hola"\nOtra línea']])
  expect(csv.startsWith("\uFEFF")).toBe(true)
  expect(csv).toContain("'=1+1")
  expect(csv).toContain('"José, dijo ""hola""\nOtra línea"')
})
```

- [ ] **Paginación completa.** Para admin, obtener filas de events y reports en páginas estables ordenadas por PK; no confiar en `getAllEvents(1,1000)` ni solo en página visible. Leer también aprobados finalizados sin reporte para calcular pendientes. `getAllAttendanceResponses` recorre cursores hasta nextCursor=null; errores interrumpen exportación con aviso, no descargan archivo parcial. En consultas bajo RLS un propietario nunca obtiene otros eventos. Revalidar filtros en dominio; no pasar texto sin escapar a `.or()`.
- [ ] **Estadísticas.** Título Resultados de eventos y pestaña Solicitudes existente. Cards con asistentes por categoría y total, reportes entregados, pendientes y tardíos; gráfica por semestre/programa reutilizando ChartFrame/Recharts; tabla por evento con conteos declarados y respuestas Google en columnas distintas. Promedio denominador=eventos con reporte enviado; clasificar tardío por first_submitted_at frente al día local límite, no por fecha de corrección. En UI «Asistencias reportadas», no «Personas únicas». Puede repetirse una persona entre eventos. No inferir satisfacción, impacto ni categorías no capturadas.
- [ ] **CSV y receipt.** `createCsv` protege texto que comienza, tras whitespace de control, con =,+,-,@; anteponer apóstrofo y escapar CSV, mantener números generados como números. UTF-8 BOM + CRLF, comillas dobles duplicadas. Reportes detallados: ID, nombre, semestre, programa, fechas en Tijuana, correo, tres categorías, total, organizadores, links, reseña, primer/último envío, basis y snapshot usado. Resumen: métricas mostradas en filtros. Participantes: evento, response ID, fecha, nombre, correo y categoría disponibles. Exportaciones solo por acción explícita, no logs. Descargar con Blob y revocar object URL después. Receipt también permite CSV de su reporte; participación exporta todas sus páginas.
- [ ] **Verificar.** Suites de CSV/analytics, fixtures >1,000, `npx tsc --noEmit`, `npm run lint`, `npm run build`, y apertura del CSV con acentos/saltos en visor de texto/hoja sin ejecutar fórmulas. Commit `feat: analyze and export event results and attendance`; push.

### Task 8: Configuración institucional, pruebas integrales y activación

**Files:** Create `docs/GOOGLE_ATTENDANCE_SETUP.md`, `docs/REPORTING_ACCEPTANCE.md`. Modify `docs/ARCHITECTURE.md`, `docs/COMPONENTS.md`, `docs/DATABASE.md`, `docs/DEPLOYMENT.md`, `docs/DEVELOPMENT.md`. No claves ni IDs privados reales en documentación pública.

**Consumes:** Todas las unidades anteriores, proyecto Supabase confirmado y coordinación con acceso a Google. **Produces:** Conexión comprobada o estado explícito pendiente de activación, registro de pruebas sin datos personales y guía de operación.

- [ ] **Documentar pasos exactos para coordinación.** Abrir editor del Form de participantes, obtener ID de edición, abrir proyecto Apps Script vinculado, copiar Code.gs/manifest revisados, configurar Properties y ejecutar inspectFormConfiguration. Identificar/agregar pregunta requerida ID evento; mapear nombre y opcionales según campos reales. Obtener URL precargada con UUID de un evento de prueba y copiar una plantilla con solo ese valor sustituido por `{eventId}`. Probar que no se perdió el resto de configuración del Form. No cambiar requisitos de login, permisos de respuestas ni compartir archivos públicamente sin necesidad.
- [ ] **Configurar integración por canal privado.** Generar secreto aleatorio ≥32 bytes y cargarlo en private.attendance_integrations mediante sesión DB autorizada y en Script Properties; anon key no es el secreto. No introducir credencial amplia de Supabase en Apps Script. Configurar source_form_id y enabled; guardar URL pública y plantilla en workflow_settings vía admin. Instalar trigger bajo cuenta de coordinación, autorizar los scopes que usa el script y registrar quién debe mantenerlo (sin publicar correos privados).
- [ ] **Desplegar de forma compatible.** Ejecutar migraciones 003..006 contra pruebas primero. Aplicar esquema de reportes antes del frontend que lo consulta. Activar reports_rollout_at explícitamente al poner el flujo nuevo en producción; no usar fecha de compilación ni rellenar todas las filas antiguas con pendiente. Si coordinación aún no configuró Google, reporte y checklist operan con lista alternativa y estado unconfigured. No declarar verificación activa hasta siguiente prueba. Mantener cambios de anticipación independientes para poder entregarlos antes.
- [ ] **Prueba integral institucional controlada.** Usar evento aprobado de prueba identificado por coordinación: abrir QR en móvil, comprobar ID, enviar una respuesta de prueba por el Form real, ejecutar syncAttendance manual y comprobar que count cambia exactamente a 1 en el evento correcto. Repetir sync sin duplicar. Enviar segunda respuesta, corregir/eliminar la primera en Google con autorización sobre datos de prueba y confirmar snapshot nuevo. Completar un reporte sin lista cuando count>0 y fresco; hacerlo con lista cuando count=0. Simular red caída y snapshot vencido en pruebas (no alterando registros reales) y confirmar que DB exige lista. Guardar captura sin nombres/correos o evidencia redactada en acceptance, no respuestas privadas.
- [ ] **Control de regresiones.** Registro a cinco días hábiles y rechazo un día antes; fin de semana/DST; aprobar/rechazar y correos siguen intactos; owner/admin/otro usuario; snapshot inválido no concede exención; enviada desaparece de pendientes; histórico no se acusa incumplido; exported matches filters; móvil/teclado/print/QR. `npm test`, todos los scripts SQL locales, `npx tsc --noEmit`, `npm run lint`, `npm run build`. Si falla, corregir y repetir solo las verificaciones afectadas más el gate de build; no marcar completo con mocks como evidencia del servicio real.
- [ ] **Guía de fallos y rollback.** Si Google falla, mostrar última actualización y permitir lista alternativa. Deshabilitar integración detiene nuevas escrituras; no borrar reportes ni respuestas para revertir. Para reactivar, corregir configuración y obtener snapshot completo nuevo. Si UI de reportes falla, revertir frontend manteniendo tablas/datos; no ejecutar down migrations destructivas. El viejo Form solo sirve al procedimiento histórico o a una contingencia explícita, no como envío simultáneo que genere doble captura.
- [ ] **Commit y push de documentación operativa:** `docs: document reporting rollout and Google attendance setup`. Si la configuración institucional sigue pendiente, escribir exactamente qué paso externo falta y mantener la función en estado sin verificar; no presentarlo como fallo de código ni completitud total.

## Criterios finales de aceptación para el usuario

- [ ] Puedo registrar el lunes para el lunes siguiente y el viernes para el viernes siguiente; se excluyen fines de semana al contar, no los festivos.
- [ ] Al abrir mi evento aprobado veo qué debo hacer y qué ya está completado.
- [ ] El QR dice que cada participante registra su propia asistencia y lleva mi evento precargado.
- [ ] La plataforma muestra respuestas reales de ese evento y cuándo se sincronizaron.
- [ ] Puedo guardar y enviar el reporte completo sin abrir Google Forms.
- [ ] Si hay respuestas verificadas, no se exige una segunda lista; si faltan o no se pudieron comprobar, tengo una alternativa explícita.
- [ ] Puedo corregir un reporte sin duplicarlo ni perder el anterior por un error de red.
- [ ] Un reporte recibido desaparece de mis pendientes; no significa constancias emitidas.
- [ ] Coordinación consulta estadísticas y descarga todos los datos filtrados; ningún usuario ve participantes ajenos.
- [ ] Los eventos anteriores conservan un tratamiento histórico claro.

## Mensaje de traspaso para ejecutar

«Implementa `docs/superpowers/plans/2026-09-23-event-reports-checklist.md` siguiendo su spec enlazada. Empieza por la tarea 1 de cinco días hábiles. Ejecuta las tareas secuencialmente con pruebas de reglas y permisos; haz commit convencional y push por cada unidad. Conserva correos y RLS existentes, no añadas service-role keys, no inventes IDs de Google y no incluyas secretos en código ni documentación. Configura la conexión institucional solo con valores reales de coordinación; mientras tanto debe aparecer sin verificar. No confundas haber terminado el código con haber comprobado la integración en producción.»

## Registro de ejecución

Tareas 1–7 implementadas en `codex/event-reports-checklist`. La tarea 8 tiene documentación y verificaciones independientes completadas, migraciones 003–005 aplicadas al proyecto vinculado y conexión institucional pendiente de los IDs/configuración de coordinación. No se necesita una migración 006: la configuración de workflow forma parte de 004. Consultar [REPORTING_ACCEPTANCE.md](../../REPORTING_ACCEPTANCE.md) para pruebas efectivamente realizadas y límites de la verificación; el checklist original anterior es la especificación de aceptación, no evidencia de pruebas institucionales realizadas.
