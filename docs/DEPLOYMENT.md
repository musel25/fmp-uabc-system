# Deployment

## Where it runs

- **Hosting:** Vercel — production at [fmp-uabc-system.vercel.app](https://fmp-uabc-system.vercel.app), auto-deployed from `master` on GitHub (`musel25/fmp-uabc-system`).
- **Database & auth:** Supabase project (Postgres + Auth). The auth redirect URLs in `lib/supabase-auth.ts` point at the production domain — update them if the domain changes.
- **Email:** Resend, via the `RESEND_API_KEY` environment variable.

## Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Public by design |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public by design; RLS enforces access |
| `RESEND_API_KEY` | production | Without it, emails are logged server-side instead of sent |

No service-role key is used anywhere, on purpose.

## Releasing

1. Merge/push to `master` → Vercel builds and deploys automatically.
2. The build fails on any TypeScript or ESLint error (enforced in `next.config.mjs` by *not* ignoring them) — so a green build is a real signal.
3. **If the release includes a migration, apply the SQL to Supabase *before* pushing the code** (Dashboard → SQL Editor, or the Management API). Code that references columns the database doesn't have yet breaks event registration.

## Operations notes

- **Promote an admin:** Supabase Dashboard → Table Editor → `profiles` → set `role = 'admin'`. There is deliberately no in-app way to do this.
- **Auth emails** (confirmation, password reset) are sent by Supabase itself and configured in the Supabase dashboard, separate from Resend.
- **Backups / data:** standard Supabase tooling; the app performs no deletes (no DELETE policies), so data loss via the app is not possible.

## Reportes finales y seguimiento

Aplicar migraciones 003, 004 y 005 en orden antes del frontend. Mantener `reports_rollout_at` nulo hasta verificar el despliegue; entonces establecer explícitamente el instante de corte (UTC) en `public.workflow_settings`. No marcar retrospectivamente todos los eventos sin reporte como pendientes. Google puede seguir sin configurar: se permite lista alternativa. Si es necesario revertir, restaurar el frontend anterior conservando tablas y datos; no ejecutar eliminaciones. La integración se deshabilita mediante `private.attendance_integrations.enabled`. Consultar [pruebas y límites](REPORTING_ACCEPTANCE.md).

## Estadísticos del reporte final (006–007)

Antes de publicar, aplicar únicamente las migraciones pendientes: 006 agrega `attendance_responses.answers` y actualiza la función de sincronización; 007 crea el archivo histórico con lectura exclusiva de administradores. Ambas usan una transacción al ejecutarlas como archivos SQL. El formulario de reporte final no necesita cambios ni una conexión a la integración de participantes.

1. Consultar el historial de migraciones y comprobar las columnas y tablas existentes.
2. Guardar respaldos de esquema y datos fuera del repositorio, con acceso restringido. El respaldo de datos incluye los esquemas de aplicación, autenticación y almacenamiento.
3. Restaurar los datos de aplicación en una base local descartable y probar las migraciones pendientes. Comparar conteos y huellas del contenido antes y después.
4. Aplicar las migraciones a producción antes de integrar el frontend. Registrar cada migración en el historial de Supabase. Si se usa una herramienta que administra la transacción, evitar un `COMMIT` interno que cierre esa transacción antes de registrar el historial.
5. Comparar los datos de producción con el estado previo. Verificar RLS, permisos de funciones y la nueva columna.
6. Publicar desde `master` y comprobar el estado `READY` y el dominio de producción.

No ejecutar `schema.sql` sobre producción ni usar reinicios de base de datos. No reemplazar el archivo histórico durante el despliegue. La importación del CSV es una operación posterior con vista previa. Para revertir el frontend, conservar las tablas y los datos agregados.
