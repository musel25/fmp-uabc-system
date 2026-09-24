import { supabase } from './supabase'
import { dbRowToEventReport, reportValuesToDbJson } from './event-mapper'
import type { EventReport, ReportValues } from './types'
export async function getEventReport(eventId:string):Promise<EventReport|null>{
 const {data,error}=await supabase.from('event_reports').select('*').eq('event_id',eventId).maybeSingle()
 if(error)throw error
 return data?dbRowToEventReport(data):null
}
export async function saveEventReport(eventId:string,values:ReportValues,mode:'draft'|'submit',expectedVersion:number):Promise<EventReport>{
 const {data,error}=await supabase.rpc('save_event_report',{p_event_id:eventId,p_values:reportValuesToDbJson(values),p_mode:mode,p_expected_version:expectedVersion})
 if(error)throw new Error(error.code==='40001'?'El reporte cambió en otra sesión. Recarga antes de guardar.':error.message)
 return dbRowToEventReport(data)
}
