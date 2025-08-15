import { supabase } from './supabase'
import type { Event, EventStatus } from './types'

// Convert database row to Event type (reuse from supabase-database.ts)
function dbRowToEvent(row: any): Event {
  return {
    id: row.id,
    name: row.name,
    responsible: row.responsible,
    email: row.email,
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
    status: row.status,
    certificateStatus: row.certificate_status,
    userId: row.user_id,
    adminComments: row.admin_comments,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    cvFiles: [], // Will be loaded separately
    programFile: undefined // Will be loaded separately
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
      .select()
      .single()

    if (error) throw error

    return dbRowToEvent(data)
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
export async function getCertificateRequests(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('certificate_requests')
      .select(`
        *,
        events (
          id,
          name,
          responsible,
          start_date,
          end_date,
          program,
          user_id,
          profiles!events_user_id_fkey (
            name,
            email
          )
        )
      `)
      .eq('status', 'pending')
      .order('requested_at', { ascending: true })

    if (error) throw error

    return data
  } catch (error) {
    console.error('Get certificate requests error:', error)
    throw error
  }
}

// Approve certificate request
export async function approveCertificateRequest(requestId: string): Promise<void> {
  try {
    // Start a transaction to update both certificate request and event
    const { data: request, error: requestError } = await supabase
      .from('certificate_requests')
      .update({
        status: 'approved',
        processed_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select('event_id')
      .single()

    if (requestError) throw requestError

    // Update the event's certificate status
    const { error: eventError } = await supabase
      .from('events')
      .update({
        certificate_status: 'emitidas',
        updated_at: new Date().toISOString()
      })
      .eq('id', request.event_id)

    if (eventError) throw eventError
  } catch (error) {
    console.error('Approve certificate request error:', error)
    throw error
  }
}

// Reject certificate request
export async function rejectCertificateRequest(requestId: string, reason?: string): Promise<void> {
  try {
    const updateData: any = {
      status: 'rejected',
      processed_at: new Date().toISOString()
    }

    if (reason?.trim()) {
      updateData.rejection_reason = reason.trim()
    }

    const { error } = await supabase
      .from('certificate_requests')
      .update(updateData)
      .eq('id', requestId)

    if (error) throw error
  } catch (error) {
    console.error('Reject certificate request error:', error)
    throw error
  }
}

// Get admin statistics
export async function getAdminStatistics() {
  try {
    // Get event statistics
    const { data: eventStats, error: eventError } = await supabase
      .from('events')
      .select('status, certificate_status, created_at')

    if (eventError) throw eventError

    // Get certificate request statistics
    const { data: certStats, error: certError } = await supabase
      .from('certificate_requests')
      .select('status, requested_at')

    if (certError) throw certError

    // Calculate statistics
    const total = eventStats.length
    const byStatus = {
      en_revision: eventStats.filter((e) => e.status === 'en_revision').length,
      aprobado: eventStats.filter((e) => e.status === 'aprobado').length,
      rechazado: eventStats.filter((e) => e.status === 'rechazado').length,
    }

    const byCertificateStatus = {
      sin_solicitar: eventStats.filter((e) => e.certificate_status === 'sin_solicitar').length,
      solicitadas: eventStats.filter((e) => e.certificate_status === 'solicitadas').length,
      emitidas: eventStats.filter((e) => e.certificate_status === 'emitidas').length,
    }

    const certificateRequests = {
      pending: certStats.filter((c) => c.status === 'pending').length,
      approved: certStats.filter((c) => c.status === 'approved').length,
      rejected: certStats.filter((c) => c.status === 'rejected').length,
    }

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentEvents = eventStats.filter(
      (e) => new Date(e.created_at) >= thirtyDaysAgo
    ).length

    const recentCertRequests = certStats.filter(
      (c) => new Date(c.requested_at) >= thirtyDaysAgo
    ).length

    return {
      events: {
        total,
        byStatus,
        byCertificateStatus,
        recent: recentEvents
      },
      certificates: {
        requests: certificateRequests,
        recent: recentCertRequests
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