'use client'
import { useEffect,useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { getAuthUser } from '@/lib/supabase-auth'
import { getEventById } from '@/lib/supabase-database'
import { getEventReport } from '@/lib/supabase-reports'
import { getAttendanceSummary } from '@/lib/supabase-attendance'
import { evidenceDeadline,formatLongDate } from '@/lib/workflow'
import { EventReportForm } from '@/components/events/report/event-report-form'
import { ReportReceipt } from '@/components/events/report/report-receipt'
import type { Event,EventReport,AttendanceSummary } from '@/lib/types'
export default function ReportPage(){
 const {id}=useParams<{id:string}>(),[event,setEvent]=useState<Event|null>(null),[report,setReport]=useState<EventReport|null>(null),[attendance,setAttendance]=useState<AttendanceSummary|null>(null),[owner,setOwner]=useState(false),[editing,setEditing]=useState(false),[error,setError]=useState(''),[loading,setLoading]=useState(true),[attendanceError,setAttendanceError]=useState(false)
 useEffect(()=>{let mounted=true;void(async()=>{try{const [user,e,r,a]=await Promise.all([getAuthUser(),getEventById(id),getEventReport(id),getAttendanceSummary(id).catch(()=>{if(mounted)setAttendanceError(true);return {eventId:id,state:"unverified" as const,responseCount:null,lastSyncedAt:null}})]);if(!mounted)return;if(!user||!e)throw new Error('No tienes acceso a este evento.');setOwner(e.userId===user.id);setEvent(e);setReport(r);setAttendance(a)}catch(e){if(mounted)setError(e instanceof Error?e.message:'No se pudo cargar el reporte.')}finally{if(mounted)setLoading(false)}})();return()=>{mounted=false}},[id])
 const deadline=event?evidenceDeadline(event):null
 return <ProtectedRoute><AppShell><div className="mx-auto max-w-3xl space-y-6"><Link className="no-print text-sm text-primary underline" href={`/events/${id}`}>Volver al evento</Link><header><h1 className="font-display text-3xl">Reporte final del evento</h1>{event&&<><p className="mt-2 text-lg">{event.name.toLocaleUpperCase('es-MX')}</p><p className="mt-1 break-all text-xs text-muted-foreground">ID: {event.id}</p>{deadline&&<p className="mt-3 text-sm">Entrega hasta el {formatLongDate(deadline)}. {new Date()>deadline?'Puedes enviarlo; quedará registrado fuera de plazo.':''}</p>}</>}</header>{attendanceError&&<p role="status" className="rounded-md border p-3 text-sm">No pudimos verificar la asistencia electrónica. Puedes guardar un borrador o presentar el enlace de tu lista.</p>}{loading?<p>Cargando reporte…</p>:error?<div role="alert" className="card-uabc p-5"><p>{error}</p><Button variant="outline" onClick={()=>window.location.reload()}>Reintentar</Button></div>:event?.status!=='aprobado'?<p>El reporte estará disponible cuando el evento sea aprobado.</p>:report?.status==='submitted'&&!editing?<ReportReceipt event={event} report={report} onEdit={owner?()=>setEditing(true):undefined}/>:owner&&event&&attendance?<EventReportForm key={report?.version??0} event={event} report={report} attendance={attendance} onSaved={r=>{setReport(r);if(r.status==='submitted')setEditing(false)}}/>:<p>{report?'El organizador aún está preparando su reporte.':'El organizador todavía no ha entregado un reporte.'}</p>}</div></AppShell></ProtectedRoute>
}
