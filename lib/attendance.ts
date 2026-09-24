import type { WorkflowSettings } from './types'
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export function buildAttendanceLink(settings:WorkflowSettings,eventId:string):string|null{
 const template=settings.attendancePrefillTemplate
 if(!settings.attendanceEnabled||!template||!uuid.test(eventId)||template.split('{eventId}').length!==2)return null
 try{
  const u=new URL(template),published=settings.attendancePublishedUrl?new URL(settings.attendancePublishedUrl):null
  if(u.protocol!=='https:'||u.hostname!=='docs.google.com'||u.username||u.password||!/^\/forms\/d\/e\/[^/]+\/viewform$/.test(u.pathname)||u.hash)return null
  if(published&&(published.origin!==u.origin||published.pathname!==u.pathname))return null
  const entries=Array.from(u.searchParams.entries()).filter(([key,value])=>/^entry\.\d+$/.test(key)&&value==='{eventId}')
  if(entries.length!==1)return null
  u.search='';u.searchParams.set('usp','pp_url');u.searchParams.set(entries[0][0],eventId)
  return u.toString()
 }catch{return null}
}
