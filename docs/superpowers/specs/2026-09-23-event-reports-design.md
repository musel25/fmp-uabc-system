# Reporte final, asistencia y seguimiento de eventos FMP

Fecha: 2026-09-23. Estado: propuesta concreta para revisión; no implementada.

## Objetivo y decisiones del usuario

Reemplazar el Google Form de reporte final por un formulario de la plataforma que
guarde en Supabase, produzca estadísticas y permita descargar datos. Conservar el
Google Form de participantes, explicar quién debe llenarlo, generar un QR por
evento y verificar sus respuestas para evitar pedir una segunda lista. Convertir
el seguimiento en una checklist clara y persistente. Coordinación dispone de
acceso de edición y respuestas al Form y puede configurar la conexión.

Último cambio solicitado: permitir registrar eventos con **5 días hábiles** de
anticipación. Se propone lunes a viernes, sin festivos institucionales, porque el
sistema no dispone de ese calendario. El plazo de evidencias permanece en **21
días naturales** después de finalizar el evento.

## Alcance y alternativas consideradas

Se elige reporte nativo + asistencia en Google Forms sincronizada mediante Apps
Script. Un iframe no guardaría respuestas en nuestra base. Sustituir también la
asistencia sería una migración distinta y requeriría conocer todas sus preguntas.
La autodeclaración «compartí el QR» es insuficiente para marcar asistencia
verificada, dado que el usuario prefiere comprobar las respuestas.

No incluye emisión de constancias, análisis con IA, almacenamiento de fotografías,
migración automática de reportes históricos ni cambios a destinatarios de correo.
Las estadísticas son agregados deterministas. La descarga inicial es CSV compatible
con Excel; se ofrece también vista imprimible del reporte y QR en PNG.

## Restricciones globales

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

## 1. Anticipación de cinco días hábiles

Comparar fechas civiles en Tijuana, no intervalos de 120 horas. Obtener la fecha
actual local, avanzar un día a la vez y contar solo lunes a viernes hasta cinco.
La primera fecha admisible es ese día desde las 00:00, sin contar el día actual.
Los eventos pueden celebrarse en fin de semana si su fecha está después del mínimo.

Ejemplos: lunes 21/09/2026 → lunes 28/09/2026; viernes 25/09/2026 → viernes
02/10/2026; sábado 26/09/2026 → viernes 02/10/2026. La hora del dispositivo y
los cambios de horario de verano no deben alterar el día resultante.

Actualizar validación Zod, aviso que bloquea el avance, mínimo del input, guías,
texto de página y documentación. Aplicar también al reenvío de eventos rechazados.
Un trigger valida INSERT y cambios de fecha/reenvíos del propietario en la base;
aprobar/rechazar eventos existentes no vuelve a validar la anticipación.
No revalidar filas antiguas durante la migración.

## 2. Reporte final propio

Ruta: /events/[id]/report. Acceso: propietario del evento y administradores.
Solo el propietario escribe el reporte; coordinación lo consulta y exporta.
Permitir borrador después de aprobar el evento; envío final después de terminar.
Los envíos tardíos se aceptan y se identifican como «Fuera de plazo».

| Dato | Comportamiento |
|---|---|
| ID del evento | Derivado de la ruta y validado por DB; visible, no editable |
| Nombre de actividad | Derivado de events.name; copia en mayúsculas en el reporte |
| Correo | Precargar del perfil, editable con validación de email |
| Docentes asistentes | Entero de 0 a 1,000,000; vacío no equivale a cero |
| Alumnos asistentes | Misma regla |
| Comunidad general | Misma regla; no incluir en otra categoría a la misma persona |
| Total | Suma calculada; no editable; permitir cero con aviso informativo |
| Docentes organizadores | Filas de nombre completo y grado, o «No participaron» |
| Estudiantes organizadores | Filas de nombre y nivel: licenciatura, maestría, otro posgrado; o «No participaron» |
| Lista de asistencia | Un enlace HTTPS a lista/archivo; requerido salvo exención verificada |
| Fotografías | De 0 a 10 enlaces HTTPS a fotos o carpetas; opcional como en el Form original |
| Reseña | Obligatoria, 1–250 palabras; convertir a mayúsculas al guardar/enviar |

La interfaz agrupa Asistencia, Organizadores y Evidencias/reseña. Muestra progreso
de campos, contador de palabras, errores cerca del campo y resumen al enviar.
No repetir el wizard de solicitud inicial. No interpretar las fotos como archivos
subidos a la plataforma; aclarar que deben compartir acceso con coordinación.
No visitar automáticamente los enlaces ni cambiar sus permisos de Drive.

Borradores guardados explícitamente en Supabase, con fecha de último guardado.
Advertir al salir con cambios sin guardar. Tras enviar: «Reporte recibido», fecha,
acceso de consulta, descarga CSV y vista para imprimir/guardar como PDF mediante
el navegador. La copia descargable reemplaza la casilla de Google «enviarme copia»;
no agregar un nuevo sistema de envío de correos en esta fase.

Un reporte por evento. Se puede corregir un reporte enviado mediante un nuevo
envío completo y válido; no volverlo borrador. Mantener first_submitted_at,
actualizar submitted_at e incrementar version. No sobrescribir una edición más
reciente: detectar conflicto de versión y pedir recargar. Esto evita que una
corrección temporal quite del panel un reporte ya entregado.

## 3. Asistencia electrónica y exención

Formulario de participantes conocido:
https://forms.gle/GmP7enabiaKjuxqE8

Su URL pública resuelve a:
https://docs.google.com/forms/d/e/1FAIpQLSeysqv22WrblmCySDWGFe8eZu3rkvjh-5eED-IAo7ExioyaYg/viewform

No se han inspeccionado sus preguntas: requiere iniciar sesión. El identificador
de edición de Google y los IDs de preguntas son valores de configuración que
coordinación debe obtener. **No deducirlos del ID público ni inventarlos.**

Configuración obligatoria: pregunta de ID de evento, enlace precargado comprobado,
nombre del participante y acceso a respuestas. Correo/categoría se importan solo
si el formulario realmente los captura; valores ausentes permanecen null. Si falta
ID de evento, coordinación agrega ese campo requerido. Nunca asociar por nombre
del evento ni por coincidencias aproximadas. No importar respuestas históricas sin
un ID válido; informar a coordinación de las no vinculadas.

Apps Script, bajo cuenta institucional de coordinación, consulta respuestas cada
15 minutos y envía snapshots por evento a una RPC limitada de Supabase. Cada
snapshot incluye IDs estables de respuesta, fecha, nombre y los campos opcionales
configurados. Los reintentos reemplazan el mismo snapshot, sin sumar duplicados.
Una consulta completa permite reflejar correcciones y eliminaciones en Google.

No se necesita una service-role key: una función SECURITY DEFINER restringida
verifica HMAC SHA-256, timestamp y formulario autorizado antes de escribir. El
secreto vive en Script Properties y una tabla privada no expuesta por PostgREST.
La anon key pública sirve únicamente para llegar al endpoint; sin firma válida
no se lee ni escribe información. search_path fijo, nombres cualificados y grants
explícitos. No credenciales, respuestas completas ni firmas en logs/repositorio.

Cada evento conserva last_synced_at, snapshot_started_at, cantidad de respuestas
y participantes normalizados. La consulta de destinos para el script solo devuelve
IDs de eventos aprobados, paginados; también está firmada. La configuración del QR
se lee con sesión y no contiene secretos.

| Estado | Regla al enviar el reporte |
|---|---|
| Snapshot completo, ≤60 minutos, al menos una respuesta válida | Exención automática |
| Snapshot completo, ≤60 minutos, cero respuestas | Lista requerida |
| Sin conexión, sin snapshot o snapshot >60 minutos | Sin verificar; guardar borrador o presentar lista |
| Lectura de progreso falla | Mostrar error; nunca tratarlo como cero respuestas ni como éxito |

Validar la exención en la transacción de envío en DB, no mediante un booleano del
navegador. Guardar evidencia de la decisión (fuente, conteo y fecha del snapshot)
en el reporte enviado. No revocar una entrega pasada por una caída posterior de
Google; una nueva corrección requiere validar de nuevo o proporcionar lista.

Contar **respuestas**, no prometer personas únicas ni presencia física comprobada.
El ID estable evita duplicados de sincronización; dos envíos distintos de una misma
persona continúan siendo dos respuestas. Mostrar diferencia entre respuestas y
asistentes declarados como aviso a coordinación. No sumar ambos en estadísticas.

Los formularios precargados de Google son editables: validar UUID, existencia y
estado aprobado al sincronizar. Un QR no es un mecanismo de autenticación.

## 4. Checklist y acciones claras

En el detalle del evento sustituir la colección de botones sueltos por una
checklist con estados pendiente, en curso, completado y sin verificar. Una acción
principal por momento, con la siguiente explicación siempre visible. Conservar
«Ver proceso completo» para consultar las seis fases institucionales.

| Paso | Quién / cómo se completa |
|---|---|
| Registrar evento | Automático, existe la solicitud |
| Obtener aprobación | Automático, estado del evento; rechazo muestra corrección |
| Preparar evento | Organizador confirma reserva (o no aplica si En línea) y difusión |
| Registrar asistencia de participantes | Respuestas verificadas; «Ya lo compartí» solo registra una tarea manual |
| Entregar reporte final | Automático, reporte enviado; muestra plazo y fecha de recepción |

Preparación y compartir QR son ayudas, no bloqueos del envío del reporte. Dejar
claro «Confirmado por ti» frente a «Verificado por el sistema». Abrir o descargar
un enlace no marca una tarea como realizada. La lista alternativa permite completar
la evidencia de asistencia al enviar aunque no haya respuestas electrónicas.

Tarjeta QR: nombre del evento, «Registro de asistencia para participantes», botones
Descargar QR, Copiar enlace y Copiar instrucciones. QR generado localmente en el
navegador; no enviar URLs/datos a un servicio externo de generación. Mostrarlo en
pantalla e imprimirlo junto al título y la instrucción. Ofrecer enlace legible para
quien no pueda escanear. Hasta configurar un enlace precargado válido, mostrar
«QR por evento pendiente de configuración»; no presentar el enlace genérico como
si asociara automáticamente respuestas al evento.

Texto para compartir: «Participantes de [evento]: registren su propia asistencia
escaneando este QR o abriendo el enlace. Comprueben el nombre/ID del evento antes
de enviar. Si Google solicita iniciar sesión, usen la cuenta permitida por el
formulario». No pedir al organizador llenar el registro en nombre de todos.

Plantilla alternativa imprimible, con nombre/ID del evento y filas vacías para
nombre, categoría y firma. Acceso desde la tarjeta de asistencia; el organizador
comparte después un enlace a su lista digitalizada. No reemplazar silenciosamente
un formato institucional existente si coordinación proporciona uno durante setup.

Dashboard y tarjetas muestran el mismo estado que el detalle. Usar consultas
agrupadas de progreso, no una petición por evento. Después de enviar, refrescar
resumen y eliminar la advertencia de evidencia pendiente. Un fallo de carga nunca
debe producir «Nada pendiente por entregar».

## 5. Analíticas, permisos y adopción

Panel admin: pestañas Solicitudes (existente) y Resultados de eventos (nueva).
Filtros de semestre de la fecha de inicio en Tijuana, programa y evento. Totales
de asistentes por categoría, eventos con reporte, promedio por evento reportado,
entregados/en plazo/tardíos y pendientes. Denominador pendiente: eventos aprobados
ya terminados sujetos al nuevo seguimiento y sin reporte enviado.

En el detalle del evento, propietario y admin pueden consultar/descargar sus
respuestas de participantes. Nunca crear una lista pública de nombres/correos.
Coordinación puede exportar resultados de varios eventos; propietarios solo los
suyos. Campos ausentes permanecen vacíos y categoría desconocida no se adivina.

Exportaciones: reportes detallados (una fila por evento), resumen de resultados y
participantes (una fila por respuesta). Incluir etiquetas claras de origen de cada
conteo, UTF-8 BOM, escape de comillas/saltos de línea y defensa contra fórmulas CSV.
Descargar el conjunto filtrado completo mediante paginación estable, no solo la
primera página ni el límite actual de 1,000 eventos. Los borradores no contribuyen
a totales de asistencia. Revisiones de un reporte cuentan una sola vez.

Guardar reports_rollout_at en configuración al activar la función. Eventos que
terminaron antes sin reporte propio aparecen «Sin seguimiento en plataforma» y
no se clasifican como incumplidos ni pendientes. Si luego presentan un reporte
propio, sus resultados sí se incluyen. Conservar el enlace histórico a Google
para consulta del proceso anterior, sin inferir entregas a partir de clics.

## 6. Modelo y fronteras

- events sigue siendo solicitud/revisión; no agregar columnas editables de
  seguimiento que obliguen a debilitar su RLS.
- event_reports: fila única por evento, borrador/enviado, contenido estructurado,
  versión, fechas y evidencia de exención al enviar.
- event_preparation: confirmaciones manuales de reserva/difusión/QR por evento.
- attendance_responses: último snapshot por evento, fuente y response_id estables,
  datos mínimos normalizados; solo propietario/admin puede leer.
- attendance_sync_state: última sincronización válida de cada evento, sin secreto.
- workflow_settings: inicio de adopción, Form publicado y plantilla de enlace
  precargado, sin secretos; admin configura, usuarios autenticados consultan.
- private.attendance_integrations: secreto y Form de origen admitido; sin permisos
  para anon/authenticated ni exposición API.

RPCs para guardar/enviar reportes validan identidad, propiedad, estado del evento,
versiones y contenidos. Ningún usuario puede establecer evidencia de exención,
fechas de envío o contadores de sincronización. RPCs de lectura respetan RLS.

## 7. Entrega por fases y aceptación

1. Cinco días hábiles: entrega pequeña, independiente y comprobable.
2. Reporte nativo y reglas de datos; funciona con lista alternativa desde el inicio.
3. Conexión de asistencia, QR y configuración por coordinación.
4. Checklist, dashboard y analíticas/exportaciones.
5. Validación integral y activación con evento de prueba institucional.

Pruebas obligatorias: límite de cinco días y zonas horarias; cuentas separadas y
escrituras directas no autorizadas; borrador incompleto y reseña 250/251; duplicados,
snapshots antiguos/vacíos/fallidos; exención cambiando durante el envío; histórico;
exportación >1,000 filas y CSV con fórmulas; experiencia móvil y QR realmente escaneado.

Coordinar el setup de Google es una dependencia de activación, no permiso para
inventar un éxito. Se puede implementar y probar con un Form de prueba y fixtures
antes de recibir los valores reales. No habilitar «verificado» en producción hasta
completar la prueba de extremo a extremo con coordinación.

## Referencias técnicas verificadas

- [Apps Script: triggers instalables](https://developers.google.com/apps-script/guides/triggers/installable)
- [FormResponse: respuestas y URL precargada](https://developers.google.com/apps-script/reference/forms/form-response)
- [Form: lectura de respuestas](https://developers.google.com/apps-script/reference/forms/form)
- [Utilities: HMAC](https://developers.google.com/apps-script/reference/utilities/utilities)
- [PostgreSQL pgcrypto](https://www.postgresql.org/docs/current/pgcrypto.html)
- [Supabase: funciones, search_path y permisos](https://supabase.com/docs/guides/database/functions)
