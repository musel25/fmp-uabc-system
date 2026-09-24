'use client'
import { useEffect,useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { emptyReportValues,reportDraftSchema,reportSubmissionSchema } from '@/lib/event-report'
import { saveEventReport } from '@/lib/supabase-reports'
import { ReportOrganizers } from './report-organizers'
import { ReportEvidence } from './report-evidence'
import type { Event,EventReport,ReportValues,AttendanceSummary } from '@/lib/types'
export function EventReportForm({event,report,attendance,onSaved}:{event:Event;report:EventReport|null;attendance:AttendanceSummary;onSaved:(r:EventReport)=>void}){
 const initial:ReportValues=report?Object.fromEntries(Object.keys(emptyReportValues('')).map(k=>[k,report[k as keyof ReportValues]])) as unknown as ReportValues:emptyReportValues(event.email||'')
 const form=useForm<ReportValues>({resolver:zodResolver(reportDraftSchema),defaultValues:initial})
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[review,setReview]=useState(false),[savedAt,setSavedAt]=useState(report?.updatedAt)
 const dirty=form.formState.isDirty
 useEffect(()=>{const guard=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard)},[dirty])
 const submit=async(mode:'draft'|'submit')=>{
  const parsed=(mode==='draft'?reportDraftSchema:reportSubmissionSchema).safeParse(form.getValues())
  if(!parsed.success){setError(parsed.error.issues.map(i=>i.message).join('. '));for(const issue of parsed.error.issues)form.setError(issue.path.join('.') as keyof ReportValues,{message:issue.message});return}
  if(mode==='submit'&&!review){setReview(true);setError('');return}
  setBusy(true);setError('')
  try{const saved=await saveEventReport(event.id,parsed.data,mode,report?.version??0);form.reset(parsed.data);setSavedAt(saved.updatedAt);setReview(false);onSaved(saved)}catch(e){setError(e instanceof Error?e.message:'No se pudo guardar. Tus cambios siguen en pantalla.')}finally{setBusy(false)}
 }
 const values=form.watch()
 return <form className="space-y-6" onSubmit={e=>{e.preventDefault();void submit('submit')}}><section className="card-uabc space-y-4 p-5"><h2 className="font-display text-xl">1. Asistencia al evento</h2><p className="text-sm text-muted-foreground">Cuenta a cada persona en una sola categoría. Escribe cero cuando no hubo asistentes de ese grupo.</p><label className="block text-sm font-medium">Correo de contacto *<Input type="email" {...form.register('email')}/></label><div className="grid gap-4 sm:grid-cols-3">{([['teacherCount','Docentes'],['studentCount','Alumnos'],['communityCount','Comunidad general']] as const).map(([key,label])=><label className="block text-sm font-medium" key={key}>{label} *<Input type="number" min={0} max={1000000} step={1} value={values[key]??''} onChange={e=>form.setValue(key,e.target.value===''?null:Number(e.target.value),{shouldDirty:true})}/>{form.formState.errors[key]&&<span className="text-xs text-destructive">{form.formState.errors[key]?.message}</span>}</label>)}</div><p>Total: <strong>{(values.teacherCount??0)+(values.studentCount??0)+(values.communityCount??0)}</strong></p></section><ReportOrganizers form={form}/><ReportEvidence form={form} attendance={attendance}/>
 {review&&<section className="rounded-lg border border-primary bg-surface-2 p-5"><h2 className="font-display text-lg">Revisa antes de enviar</h2><p className="mt-2 text-sm">{event.name} · {(values.teacherCount??0)+(values.studentCount??0)+(values.communityCount??0)} asistentes · {values.teachers.length+values.students.length} organizadores. Comprueba los nombres para constancias y los enlaces de evidencia.</p><Button type="button" variant="ghost" onClick={()=>setReview(false)}>Volver a revisar campos</Button></section>}
 {error&&<p role="alert" className="rounded-lg border border-destructive p-4 text-sm text-destructive">{error}</p>}
 <div className="no-print flex flex-wrap items-center gap-3">{report?.status!=='submitted'&&<Button type="button" variant="outline" disabled={busy} onClick={()=>void submit('draft')}>Guardar borrador</Button>}<Button type="submit" disabled={busy||new Date(event.endDate)>new Date()}>{busy?'Guardando…':review?'Confirmar y enviar':report?.status==='submitted'?'Guardar correcciones':'Revisar y enviar reporte'}</Button></div><p className="text-xs text-muted-foreground" aria-live="polite">{new Date(event.endDate)>new Date()?'Puedes guardar un borrador. El envío se habilita cuando termine el evento.':savedAt?`Guardado: ${new Date(savedAt).toLocaleString('es-MX',{timeZone:'America/Tijuana'})}`:'Tus cambios se guardan al pulsar Guardar borrador o enviar.'}{dirty?' · Cambios sin guardar':''}</p></form>
}
