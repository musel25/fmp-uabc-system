# Validación de reportes y asistencia

## Alcance y reglas

- Registro: mínimo cinco días hábiles, lunes a viernes, según fecha de Tijuana. No incluye calendario de feriados.
- Reporte: borrador y envío dentro de la plataforma para el propietario de un evento aprobado; puede enviarse después de terminar el evento. Los envíos tardíos se aceptan y se identifican; el plazo es de 21 días civiles, incluido todo el último día.
- Lista alternativa: enlace HTTPS requerido salvo asistencia electrónica activa, reciente y positiva. Fotografías mediante enlaces HTTPS opcionales.
- Correcciones: versión esperada impide que una pestaña sobrescriba los cambios de otra; los errores conservan la edición en pantalla. Un reporte enviado no vuelve a borrador.
- Estadísticas: solo reportes enviados aportan asistencia declarada; las respuestas Google aparecen separadas. Exportaciones completas y filtradas, con protección de fórmulas CSV.
- Históricos: `reports_rollout_at = null` deja inactivo el seguimiento obligatorio. Una vez activado, eventos terminados antes del corte sin reporte siguen como históricos.

## Evidencia reproducible

Ejecutar desde la raíz del proyecto:

```sh
npm test
node scripts/test-database.mjs tests/database/registration-business-days.sql
node scripts/test-database.mjs tests/database/event-reports.sql
node scripts/test-database.mjs tests/database/attendance-sync.sql
npx tsc --noEmit
npm run lint
npm run build
```

Las pruebas unitarias cubren fines de semana, zona horaria, cambios de horario, validación de reportes, conteos, filtros y CSV. Las pruebas SQL ejecutan funciones y políticas reales de PostgreSQL con usuarios de prueba y rollback: propietario/usuario ajeno/anon, versiones, listas, snapshots firmados, reintentos, snapshots anteriores y reemplazos vacíos. El entorno local usa una réplica mínima de `auth.uid()` y roles; no constituye una prueba de login real de Supabase ni de entrega de correos.

No se envían correos ni respuestas de Google reales como parte de estas pruebas. Las pruebas de 1,201 filas comprueban procesamiento sin truncamiento en fixtures/SQL; las consultas del cliente recorren páginas de 200.

## Validación institucional pendiente

Seguir [GOOGLE_ATTENDANCE_SETUP.md](GOOGLE_ATTENDANCE_SETUP.md) para configurar IDs/propiedades con coordinación, escanear el QR real en un teléfono y sincronizar una respuesta controlada. Hasta completar esa prueba, no declarar activa la verificación institucional. La lista alternativa permite usar el reporte mientras tanto.

Al desplegar: aplicar migraciones antes del frontend; verificar el despliegue de Vercel y entonces establecer el corte `reports_rollout_at`. No confundir un build local correcto con una publicación comprobada.

## Revisión de interfaz local

Comprobado con componentes reales y datos ficticios: mensajes de campos requeridos, revisión previa al envío, total por categorías, diálogo accesible al seguir un enlace con cambios pendientes y recuperación al usar Atrás/Adelante. El ancho de contenido no excedió el viewport de 390 px. No se enviaron esos fixtures a producción; la ruta temporal se eliminó. La recuperación conserva cambios solo en memoria de la pestaña y versión actual, no sustituye Guardar borrador. El escaneo de QR institucional e impresión física siguen pendientes de configuración real.

## Resultado de verificación de entrega

2026-09-23 (Tijuana): 32 pruebas unitarias aprobadas; tres suites SQL aprobadas; TypeScript, ESLint y build de producción correctos. La revisión independiente detectó y se corrigió manejo de fechas nulas/no finitas, salida de ediciones y bloqueo de campos durante guardado. También se corrigieron borradores históricos, errores junto a campos y enlace legible del cartel QR.

Migraciones 003, 004 y 005 aplicadas mediante Management API en el proyecto Supabase vinculado. Verificación posterior: RLS activo en las cinco tablas, escritura directa de reportes bloqueada, esquema privado inaccesible al cliente, límite lunes→lunes correcto y fecha nula segura. Solicitudes anónimas reales a reportes, configuración y sincronización sin firma devolvieron HTTP 401. No se alteraron registros existentes de eventos ni respuestas institucionales. El corte de seguimiento se activa después de verificar el frontend publicado; Google permanece inactivo.
