import { supabase } from './supabase'
import type { Event, CreateEventData, EventStatus, CertificateStatus } from './types'

// Convert database row to Event type (handle snake_case to camelCase)
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
    programDetails: row.program_details || '',
    speakerCvs: row.speaker_cvs || '',
    codigosRequeridos: row.codigos_requeridos || 0
  }
}

// Convert Event type to database row (handle camelCase to snake_case)
function eventToDbRow(event: CreateEventData, userId: string) {
  return {
    name: event.name || '',
    responsible: event.responsible || '',
    email: event.email || '',
    phone: event.phone || '',
    program: event.program,
    type: event.type,
    classification: event.classification,
    classification_other: event.classificationOther || null,
    modality: event.modality,
    venue: event.venue || '',
    start_date: event.startDate,
    end_date: event.endDate,
    has_cost: event.hasCost || false,
    online_info: event.onlineInfo || null,
    organizers: event.organizers || '',
    observations: event.observations || null,
    program_details: event.programDetails || '',
    speaker_cvs: event.speakerCvs || null,
    codigos_requeridos: event.codigosRequeridos || 0,
    user_id: userId,
    status: 'en_revision' as EventStatus,
    certificate_status: 'sin_solicitar' as CertificateStatus
  }
}

// Create a new event
export async function createEvent(eventData: CreateEventData, userId: string): Promise<Event> {
  try {
    const dbData = eventToDbRow(eventData, userId)
    console.log('Creating event with data:', dbData)
    
    const { data, error } = await supabase
      .from('events')
      .insert([dbData])
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      throw error
    }

    return dbRowToEvent(data)
  } catch (error) {
    console.error('Create event error:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    throw error
  }
}

// Get events for a specific user
export async function getUserEvents(userId: string): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(dbRowToEvent)
  } catch (error) {
    console.error('Get user events error:', error)
    throw error
  }
}

// Get a specific event by ID
export async function getEventById(eventId: string): Promise<Event | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Event not found
      }
      throw error
    }

    return dbRowToEvent(data)
  } catch (error) {
    console.error('Get event by ID error:', error)
    throw error
  }
}

// Update an event
export async function updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
  try {
    // Convert camelCase updates to snake_case for database
    const dbUpdates: any = {}
    
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.responsible !== undefined) dbUpdates.responsible = updates.responsible
    if (updates.email !== undefined) dbUpdates.email = updates.email
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone
    if (updates.program !== undefined) dbUpdates.program = updates.program
    if (updates.type !== undefined) dbUpdates.type = updates.type
    if (updates.classification !== undefined) dbUpdates.classification = updates.classification
    if (updates.classificationOther !== undefined) dbUpdates.classification_other = updates.classificationOther
    if (updates.modality !== undefined) dbUpdates.modality = updates.modality
    if (updates.venue !== undefined) dbUpdates.venue = updates.venue
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate
    if (updates.hasCost !== undefined) dbUpdates.has_cost = updates.hasCost
    if (updates.onlineInfo !== undefined) dbUpdates.online_info = updates.onlineInfo
    if (updates.organizers !== undefined) dbUpdates.organizers = updates.organizers
    if (updates.observations !== undefined) dbUpdates.observations = updates.observations
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.certificateStatus !== undefined) dbUpdates.certificate_status = updates.certificateStatus
    if (updates.adminComments !== undefined) dbUpdates.admin_comments = updates.adminComments
    if (updates.rejectionReason !== undefined) dbUpdates.rejection_reason = updates.rejectionReason
    if (updates.codigosRequeridos !== undefined) dbUpdates.codigos_requeridos = updates.codigosRequeridos

    const { data, error } = await supabase
      .from('events')
      .update(dbUpdates)
      .eq('id', eventId)
      .select()
      .single()

    if (error) throw error

    return dbRowToEvent(data)
  } catch (error) {
    console.error('Update event error:', error)
    throw error
  }
}

// Delete an event
export async function deleteEvent(eventId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)

    if (error) throw error
  } catch (error) {
    console.error('Delete event error:', error)
    throw error
  }
}

// Submit event for review
export async function submitEventForReview(eventId: string): Promise<Event> {
  try {
    const { data, error } = await supabase
      .from('events')
      .update({ 
        status: 'en_revision',
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select()
      .single()

    if (error) throw error

    return dbRowToEvent(data)
  } catch (error) {
    console.error('Submit event for review error:', error)
    throw error
  }
}

// Search events with filters
export async function searchEvents(
  query: string = '',
  filters?: {
    program?: string
    status?: string
    startDate?: string
    endDate?: string
    userId?: string
  }
): Promise<Event[]> {
  try {
    let queryBuilder = supabase
      .from('events')
      .select('*')

    // Apply user filter if provided
    if (filters?.userId) {
      queryBuilder = queryBuilder.eq('user_id', filters.userId)
    }

    // Apply text search
    if (query.trim()) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query}%,responsible.ilike.%${query}%,email.ilike.%${query}%`
      )
    }

    // Apply filters
    if (filters?.program) {
      queryBuilder = queryBuilder.eq('program', filters.program)
    }

    if (filters?.status && filters.status !== 'all') {
      queryBuilder = queryBuilder.eq('status', filters.status)
    }

    if (filters?.startDate) {
      queryBuilder = queryBuilder.gte('start_date', filters.startDate)
    }

    if (filters?.endDate) {
      queryBuilder = queryBuilder.lte('start_date', filters.endDate)
    }

    // Order by creation date (newest first)
    queryBuilder = queryBuilder.order('created_at', { ascending: false })

    const { data, error } = await queryBuilder

    if (error) throw error

    return data.map(dbRowToEvent)
  } catch (error) {
    console.error('Search events error:', error)
    throw error
  }
}

// Get event statistics
export async function getEventStatistics(userId?: string) {
  try {
    let query = supabase.from('events').select('status, certificate_status')
    
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) throw error

    const total = data.length
    const byStatus = {
      en_revision: data.filter((e) => e.status === 'en_revision').length,
      aprobado: data.filter((e) => e.status === 'aprobado').length,
      rechazado: data.filter((e) => e.status === 'rechazado').length,
    }
    const byCertificateStatus = {
      sin_solicitar: data.filter((e) => e.certificate_status === 'sin_solicitar').length,
      solicitadas: data.filter((e) => e.certificate_status === 'solicitadas').length,
      emitidas: data.filter((e) => e.certificate_status === 'emitidas').length,
    }

    return { total, byStatus, byCertificateStatus }
  } catch (error) {
    console.error('Get event statistics error:', error)
    throw error
  }
}

