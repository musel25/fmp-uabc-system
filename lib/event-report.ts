import { z } from 'zod'
import type { AttendanceSummary, ReportValues } from './types'
export const countReportWords=(text:string)=>text.trim() ? text.trim().split(/\s+/u).length : 0
const url=z.string().trim().max(2048).refine(v=>{ if(!v)return true;try {const u=new URL(v);return u.protocol==='https:' && !u.username && !u.password}catch{return false}},'Usa un enlace HTTPS válido')
const count=z.number().int('Escribe un número entero').min(0).max(1000000).nullable()
const person=z.object({name:z.string().trim().max(250),degree:z.string().trim().max(100)})
const mode=z.enum(['none','listed']).nullable()
export const reportDraftSchema=z.object({
 email:z.string().trim().max(254).refine(v=>!v || z.string().email().safeParse(v).success,'Correo inválido'),
 teacherCount:count,studentCount:count,communityCount:count,
 teacherMode:mode,teachers:z.array(person).max(100),studentMode:mode,
 students:z.array(z.object({name:z.string().trim().max(250),level:z.enum(['licenciatura','maestria','otro_posgrado'])})).max(100),
 attendanceListUrl:url,photoUrls:z.array(url.refine(v=>!!v,'Escribe el enlace o elimina esta fila')).max(10),
 narrative:z.string().trim().max(50000).refine(v=>countReportWords(v)<=250,'Máximo 250 palabras').transform(v=>v.toLocaleUpperCase('es-MX')),
}).strict()
export const reportSubmissionSchema=reportDraftSchema.superRefine((v,ctx)=>{
 const issue=(path:string,message:string)=>ctx.addIssue({code:'custom',path:[path],message})
 if(!v.email)issue('email','Escribe un correo')
 for(const key of ['teacherCount','studentCount','communityCount'] as const)if(v[key]===null)issue(key,'Indica una cantidad, incluso si es cero')
 if(!v.narrative)issue('narrative','Escribe la reseña')
 for(const kind of ['teacher','student'] as const){
  const m=kind==='teacher'?v.teacherMode:v.studentMode
  const rows=kind==='teacher'?v.teachers:v.students
  const key=kind==='teacher'?'teachers':'students'
  if(!m)issue(`${kind}Mode`,'Indica si participaron organizadores')
  if(m==='none'&&rows.length)issue(key,'Elimina las filas si no participaron')
  if(m==='listed'&&(!rows.length||rows.some(r=>!r.name||('degree' in r&&!r.degree))))issue(key,'Completa los nombres y grados de los organizadores')
 }
})
export function emptyReportValues(email:string):ReportValues{return{email,teacherCount:null,studentCount:null,communityCount:null,teacherMode:null,teachers:[],studentMode:null,students:[],attendanceListUrl:'',photoUrls:[],narrative:''}}
export function canWaiveAttendanceList(s:AttendanceSummary,now=new Date()):boolean{
 const age=s.lastSyncedAt?now.getTime()-new Date(s.lastSyncedAt).getTime():NaN
 return s.state==='fresh'&&(s.responseCount??0)>0&&age>=0&&age<=3600000
}
