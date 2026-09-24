'use client'
import type { UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { canWaiveAttendanceList,countReportWords } from '@/lib/event-report'
import type { AttendanceSummary,ReportValues } from '@/lib/types'
export function ReportEvidence({form,attendance}:{form:UseFormReturn<ReportValues>;attendance:AttendanceSummary}){
 const urls=form.watch('photoUrls'),narrative=form.watch('narrative'),waived=canWaiveAttendanceList(attendance)
 return <section className="card-uabc space-y-5 p-5"><h2 className="font-display text-xl">3. Evidencias y reseña</h2><div className="rounded-md bg-surface-2 p-3 text-sm">{waived?`Recibimos ${attendance.responseCount} respuestas de participantes. No necesitas presentar otra lista.`:'La asistencia electrónica aún no está verificada. Para enviar el reporte, agrega el enlace de tu lista o guarda un borrador mientras se actualiza.'}</div><label className="block text-sm font-medium">Enlace de la lista de asistencia {waived?'(opcional)':'*'}<Input type="url" placeholder="https://…" {...form.register('attendanceListUrl')}/></label><p className="text-xs text-muted-foreground">Pega el enlace del archivo o carpeta. Comprueba que coordinación pueda abrirlo.</p>
 <fieldset className="space-y-3"><legend className="mb-2 text-sm font-medium">Fotografías o capturas de pantalla (opcional)</legend>{urls.map((url,i)=><div className="flex gap-2" key={i}><Input aria-label={`Enlace de fotografía ${i+1}`} value={url} type="url" onChange={e=>form.setValue('photoUrls',urls.map((v,j)=>j===i?e.target.value:v),{shouldDirty:true})}/><Button type="button" variant="outline" onClick={()=>form.setValue('photoUrls',urls.filter((_,j)=>j!==i),{shouldDirty:true})}>Quitar</Button></div>)}{urls.length<10&&<Button type="button" variant="outline" onClick={()=>form.setValue('photoUrls',[...urls,''],{shouldDirty:true})}>Agregar enlace</Button>}<p className="text-xs text-muted-foreground">Puedes enlazar una carpeta con varias fotos. Los archivos permanecen en el servicio donde los guardaste.</p></fieldset>
 <label className="block text-sm font-medium">Reseña del evento *<Textarea rows={7} {...form.register('narrative')} onBlur={()=>form.setValue('narrative',narrative.toLocaleUpperCase('es-MX'),{shouldDirty:true})}/></label><p className="text-right text-sm" aria-live="polite">{countReportWords(narrative)} / 250 palabras · Se guardará en mayúsculas</p></section>
}
