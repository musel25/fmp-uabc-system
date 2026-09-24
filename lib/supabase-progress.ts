import { supabase } from './supabase'
import { dbRowToPreparation, dbRowToWorkflowSettings } from './event-mapper'
import type { PreparationValues, WorkflowSettings } from './types'
export async function getWorkflowSettings():Promise<WorkflowSettings>{
 const {data,error}=await supabase.rpc('get_workflow_settings')
 if(error)throw error
 return dbRowToWorkflowSettings(data)
}
export async function saveEventPreparation(eventId:string,v:PreparationValues):Promise<PreparationValues>{
 const {data,error}=await supabase.rpc('save_event_preparation',{p_event_id:eventId,p_values:{reservation_done:v.reservationDone,diffusion_done:v.diffusionDone,qr_shared:v.qrShared}})
 if(error)throw error
 return dbRowToPreparation(data)
}
