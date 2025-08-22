import { supabase } from './supabase'
import type { Event, EventStatus } from './types'
import { sendEventApprovedNotification, sendAdminCodesNotification } from './email'

// Convert database row to Event type (admin version with profile data)
function dbRowToEvent(row: any): Event {
  return {
    id: row.id,
    name: row.name,
    responsible: row.profiles?.name || row.responsible,
    email: row.profiles?.email || row.email,
    phone: row.phone,
    program: row.program,
    type: row.type,
    classification: row.classification,
    classificationOther: row.classification_other,
    modality: row.modality,
    venue: row.venue,
    startDate: row.start_date,
    endDate: row.end_date,
    hasCost: row.has_cost,
    costDetails: row.cost_details,
    onlineInfo: row.online_info,
    organizers: row.organizers,
    observations: row.observations,
    programDetails: row.program_details,
    speakerCvs: row.speaker_cvs,
    status: row.status,
    userId: row.user_id,
    adminComments: row.admin_comments,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    codigosRequeridos: row.codigos_requeridos || 0
  }
}

// Get all events pending review (status = 'en_revision')
export async function getEventsForReview(): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        profiles!events_user_id_fkey (
          name,
          email
        )
      `)
      .eq('status', 'en_revision')
      .order('created_at', { ascending: true }) // Oldest first for review queue

    if (error) throw error

    return data.map(dbRowToEvent)
  } catch (error) {
    console.error('Get events for review error:', error)
    throw error
  }
}

// Get all events (admin view with pagination)
export async function getAllEvents(
  page = 1,
  limit = 20,
  filters?: {
    status?: string
    program?: string
    search?: string
  }
): Promise<{ events: Event[], total: number, hasMore: boolean }> {
  try {
    let query = supabase
      .from('events')
      .select(`
        *,
        profiles!events_user_id_fkey (
          name,
          email
        )
      `, { count: 'exact' })

    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters?.program && filters.program !== 'all') {
      query = query.eq('program', filters.program)
    }

    if (filters?.search?.trim()) {
      query = query.or(
        `name.ilike.%${filters.search}%,responsible.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      )
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query
      .range(from, to)
      .order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) throw error

    const total = count || 0
    const hasMore = total > page * limit

    return {
      events: data.map(dbRowToEvent),
      total,
      hasMore
    }
  } catch (error) {
    console.error('Get all events error:', error)
    throw error
  }
}

// Approve an event
export async function approveEvent(eventId: string, comments?: string): Promise<Event> {
  try {
    const updateData: any = {
      status: 'aprobado' as EventStatus,
      updated_at: new Date().toISOString()
    }

    if (comments?.trim()) {
      updateData.admin_comments = comments.trim()
    }

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .select(`
        *,
        profiles!events_user_id_fkey (
          name,
          email
        )
      `)
      .single()

    if (error) throw error

    const approvedEvent = dbRowToEvent(data)

    // Send email notification to the event creator
    await sendEventApprovedNotification({
      eventName: approvedEvent.name,
      userName: approvedEvent.responsible || 'Usuario',
      userEmail: approvedEvent.email || '',
      eventId: approvedEvent.id
    })

    // Send email notification to admin about required codes
    await sendAdminCodesNotification({
      eventName: approvedEvent.name,
      eventId: approvedEvent.id,
      codigosRequeridos: approvedEvent.codigosRequeridos || 0,
      startDate: approvedEvent.startDate,
      endDate: approvedEvent.endDate,
      venue: approvedEvent.venue,
      type: approvedEvent.type,
      classification: approvedEvent.classification,
      classificationOther: approvedEvent.classificationOther,
      programDetails: approvedEvent.programDetails,
      userName: approvedEvent.responsible || 'Usuario',
      userEmail: approvedEvent.email || ''
    })

    return approvedEvent
  } catch (error) {
    console.error('Approve event error:', error)
    throw error
  }
}

// Reject an event
export async function rejectEvent(eventId: string, reason: string, comments?: string): Promise<Event> {
  try {
    const updateData: any = {
      status: 'rechazado' as EventStatus,
      rejection_reason: reason.trim(),
      updated_at: new Date().toISOString()
    }

    if (comments?.trim()) {
      updateData.admin_comments = comments.trim()
    }

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single()

    if (error) throw error

    return dbRowToEvent(data)
  } catch (error) {
    console.error('Reject event error:', error)
    throw error
  }
}

// Get certificate requests



// Get admin statistics
export async function getAdminStatistics() {
  try {
    // Get event statistics
    const { data: eventStats, error: eventError } = await supabase
      .from('events')
      .select('status, created_at')

    if (eventError) throw eventError


    // Calculate statistics
    const total = eventStats.length
    const byStatus = {
      en_revision: eventStats.filter((e) => e.status === 'en_revision').length,
      aprobado: eventStats.filter((e) => e.status === 'aprobado').length,
      rechazado: eventStats.filter((e) => e.status === 'rechazado').length,
    }


    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentEvents = eventStats.filter(
      (e) => new Date(e.created_at) >= thirtyDaysAgo
    ).length


    return {
      events: {
        total,
        byStatus,
        recent: recentEvents
      }
    }
  } catch (error) {
    console.error('Get admin statistics error:', error)
    throw error
  }
}

// Update event status directly (for admin use)
export async function updateEventStatus(
  eventId: string, 
  status: EventStatus, 
  comments?: string,
  rejectionReason?: string
): Promise<Event> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (comments?.trim()) {
      updateData.admin_comments = comments.trim()
    }

    if (status === 'rechazado' && rejectionReason?.trim()) {
      updateData.rejection_reason = rejectionReason.trim()
    }

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single()

    if (error) throw error

    return dbRowToEvent(data)
  } catch (error) {
    console.error('Update event status error:', error)
    throw error
  }
}