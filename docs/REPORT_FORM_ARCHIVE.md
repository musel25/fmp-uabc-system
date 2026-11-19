# Estadísticos del reporte final

El formulario compartido es **REPORTE FINAL de Eventos FMP** (`1wGwLI7a9HDV1Gsy446XWzH3wacKkYfJoSiBAYTeqXk4`). Recibe reportes del organizador: ID, actividad, asistencia en texto libre, docentes y alumnos organizadores, listas, fotografías y reseña. Una respuesta no representa a una persona asistente.

## Reportes de la plataforma

En Administración → Estadísticos → Resultados de eventos se muestran los campos equivalentes del reporte nativo. Los filtros de semestre, programa y evento se aplican a los totales, la tabla de preguntas y las descargas. Solo cuentan reportes enviados. Cada evento tiene «Ver respuestas» y «Descargar reporte CSV». El detalle permite abrir la lista adjunta para descargarla desde su proveedor. Si existe registro electrónico de participantes, también se puede consultar y descargar allí.

Los totales cuentan participaciones en eventos, no personas únicas. Los organizadores se cuentan por reporte. La plataforma asigna el ID al reporte de forma automática; el asistente no tiene que conocerlo.

## Respuestas anteriores de Google

La pestaña «Formulario anterior» conserva las preguntas y respuestas originales sin convertir texto libre en cifras inventadas. Un administrador descarga el CSV completo desde Google Forms (Respuestas → menú → Descargar respuestas), extrae el CSV si recibió un ZIP, lo selecciona, revisa la vista previa y guarda la importación.

- El archivo persiste en Supabase y está disponible para los administradores. No se guarda en el repositorio.
- Cada importación reemplaza la copia completa en una transacción. No agrega duplicados. Una versión evita sobrescribir cambios de otra sesión.
- El CSV admite comillas escapadas, comas y saltos de línea dentro de respuestas. Límite: 5 MB, 5000 respuestas y 50 columnas.
- El ID completo debe coincidir con un evento existente. No se asocia por nombre. Los registros sin coincidencia permanecen visibles en «Sin evento vinculado».
- Solo se suma asistencia cuando un evento vinculado tiene exactamente un reporte y su respuesta es un entero entre 0 y 1000000. Un cero es un dato; una respuesta vacía no lo es. Los totales en prosa y los reportes repetidos se conservan para revisión.
- El filtro de semestre usa la fecha del evento vinculado. Los registros sin evento solo aparecen al seleccionar todos los semestres.
- Los totales históricos permanecen separados de los nativos para evitar dobles conteos entre fuentes.
- Las descargas CSV incluyen todas las preguntas originales. El filtro por evento permite descargar todos sus reportes; cada reporte también tiene una descarga individual.
- Las listas adjuntas son archivos externos. Sus enlaces HTTPS se conservan. La cuenta que abre el archivo necesita permiso en Drive. El CSV del reporte no sustituye una lista nominal adjunta.
- Esta importación es manual. No activa Apps Script, no modifica el formulario y no depende de la integración de asistencia individual.

## Activación

Aplicar `migrations/007_report_form_archive.sql` en Supabase antes de publicar esta vista. Las instalaciones deben tener las migraciones anteriores. La tabla `report_form_archive` solo permite lectura a administradores mediante RLS. Las escrituras usan `save_report_form_archive`, que comprueba el rol, el tamaño, los tipos, la forma de cada fila y la versión. No se requiere una clave de servicio en el navegador.

Publicar la aplicación e importar el CSV desde una sesión administradora. No se deben insertar respuestas reales en fixtures, capturas públicas o commits. Antes de reemplazar una importación, se puede descargar la copia guardada con todos los filtros vacíos.

## Verificación

`npm test`, `npm run lint`, `npx tsc --noEmit` y `npm run build` verifican la aplicación. `tests/report-form-archive.test.ts` cubre el CSV, el enlace estricto, la ambigüedad de totales, los duplicados y los enlaces seguros. `tests/database/report-form-archive.sql` prueba los roles, el reemplazo, la versión y la conservación de datos ante errores en una base local descartable.
