# Conectar la asistencia de participantes

El reporte final vive en la plataforma. Este puente conserva el Google Form de **participantes** y consulta sus respuestas para decidir si hace falta una lista alternativa. Tener un enlace o marcar «QR compartido» no acredita asistencia.

## Configuración de coordinación

1. Abrir el editor del formulario de participantes con la cuenta institucional responsable. Usar el ID de `/forms/d/ID/edit`, **no** el ID público `/d/e/.../viewform`.
2. Abrir su proyecto de Apps Script. Copiar `integrations/google-attendance/Code.gs` y `appsscript.json`; conservar otros scripts/triggers institucionales. Configurar la propiedad `FMP_FORM_ID` con el ID de edición. Ejecutar `inspectFormConfiguration` y anotar los IDs y tipos de las preguntas, sin copiar respuestas personales a tickets.
3. Agregar o identificar una pregunta **de texto corto y obligatoria** «ID del evento». Añadir ayuda: «Este dato viene en el enlace del organizador. Comprueba que corresponde a tu evento». Identificar también la pregunta obligatoria del nombre del participante. No sustituir preguntas ni cambiar restricciones de acceso del formulario sin coordinación.
4. Configurar estas **Script Properties**, no constantes en el código:

| Propiedad | Valor |
|---|---|
| `FMP_FORM_ID` | ID de edición del formulario |
| `FMP_EVENT_ITEM_ID` | ID numérico de la pregunta ID del evento |
| `FMP_NAME_ITEM_ID` | ID de la pregunta nombre |
| `FMP_EMAIL_ITEM_ID` | Opcional; si falta, se usa el correo recopilado por Google |
| `FMP_CATEGORY_ITEM_ID` | Opcional; pregunta docente/alumno/comunidad |
| `FMP_CATEGORY_MAP` | Opcional; JSON que mapea las etiquetas reales a `docente`, `alumno`, `comunidad` |
| `FMP_SUPABASE_URL` | URL del proyecto Supabase, sin barra final |
| `FMP_SUPABASE_ANON_KEY` | Clave pública anon del proyecto, no una credencial administrativa |
| `FMP_SYNC_SECRET` | Secreto aleatorio exclusivo para este puente, al menos 32 bytes |

5. Generar el secreto en un gestor seguro y copiar exactamente el mismo valor a Script Properties y a `private.attendance_integrations`, mediante una sesión autorizada de base de datos. La tabla requiere `source_form_id` (ID de edición), `signing_secret` y `enabled`. Solo puede haber una fuente activa. No guardar el secreto en git, capturas, documentos ni variables `NEXT_PUBLIC_*`.
6. Ejecutar nuevamente `inspectFormConfiguration`. La salida incluye una URL precargada con un UUID de ejemplo; **no envía una respuesta**. Copiar esa URL y reemplazar únicamente el UUID por `{eventId}`. Guardar en la fila única de `public.workflow_settings`: `attendance_published_url` (URL pública completa `https://docs.google.com/forms/d/e/.../viewform`) y `attendance_prefill_template` (URL anterior con `entry.NUMERO={eventId}`). Las demás opciones de Google no se copian al enlace generado. No inventar el número `entry`: no siempre coincide con el ID interno de pregunta.
7. Ejecutar `syncAttendance`, autorizar los permisos de Forms, conexión externa y triggers con la cuenta responsable. Ejecutar `installSyncTrigger` para consultar cada 15 minutos. Registrar internamente quién mantiene esa cuenta y revisar sus alertas de ejecución.

El puente lee todas las respuestas antes de enviar snapshots por evento aprobado. Hay un máximo de 5,000 respuestas y 2 MiB por snapshot; si se rebasa, se detiene ese envío con error y debe ampliarse la estrategia antes de usar eventos de ese tamaño. Los conteos son respuestas, no personas deduplicadas. Sin una pregunta de categoría se conserva «No capturada».

## Prueba antes de anunciar la conexión

Usar un evento aprobado de prueba que coordinación haya identificado. Abrir el QR desde un teléfono y comprobar el UUID y nombre del evento en la plataforma. Enviar una respuesta de prueba, ejecutar `syncAttendance` y verificar que el evento correcto pase a una respuesta. Repetir la sincronización: debe seguir en una. Agregar otra, corregir el evento y eliminar únicamente respuestas de prueba, comprobando que el siguiente snapshot refleje los cambios. Probar un reporte sin lista con respuestas verificadas y otro con lista cuando no haya respuestas.

La exención exige fuente activa, snapshot exitoso con antigüedad máxima de 60 minutos y conteo mayor que cero. La base de datos vuelve a comprobarlo al enviar. «Actualizar estado» consulta lo ya sincronizado, no dispara una lectura inmediata de Google.

## Fallos y recuperación

- Sin configuración, el QR por evento aparece pendiente y se ofrece una plantilla de lista alternativa.
- Error de Google o pregunta eliminada: el puente no envía snapshots vacíos por el fallo; conserva la última lectura hasta que pierda vigencia. Revisar las ejecuciones de Apps Script, propiedades y permisos.
- Respuestas sin UUID válido o que apuntan a eventos no aprobados se contabilizan como no vinculadas en el log, sin datos personales. Corregirlas en el formulario de origen con autorización.
- Deshabilitar la fila de integración detiene nuevos envíos y la exención; no borrar respuestas/reportes para revertir. Para reactivar, resolver la causa y obtener un snapshot completo nuevo.
- Cambiar la fuente requiere deshabilitar la anterior antes de activar la nueva. No reutilizar un secreto de otra aplicación.

Estado al entregar el código: el puente está implementado y probado con fixtures y PostgreSQL; la cuenta institucional, los IDs reales de preguntas y la prueba de QR/respuestas en Google requieren configuración de coordinación.
