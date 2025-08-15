import type { Event } from "./types"

export const mockEvents: Event[] = [
  {
    id: "1",
    name: "Conferencia de Neurociencias Aplicadas",
    responsible: "Dr. María González",
    email: "maria.gonzalez@uabc.edu.mx",
    phone: "664-123-4567",
    program: "Médico",
    type: "Académico",
    classification: "Conferencia",
    modality: "Presencial",
    venue: "Auditorio Principal FMP",
    startDate: "2024-03-15T09:00",
    endDate: "2024-03-15T17:00",
    hasCost: false,
    organizers: "Dr. María González; Dr. Carlos Ruiz",
    observations: "Evento dirigido a estudiantes de medicina",
    status: "aprobado",
    certificateStatus: "solicitadas",
    createdAt: "2024-02-01T10:00:00Z",
    updatedAt: "2024-02-15T14:30:00Z",
    userId: "user1",
    cvFiles: [],
    adminComments: "Evento aprobado. Excelente propuesta académica.",
  },
  {
    id: "2",
    name: "Taller de Psicología Clínica",
    responsible: "Dra. Ana Martínez",
    email: "ana.martinez@uabc.edu.mx",
    phone: "664-987-6543",
    program: "Psicología",
    type: "Académico",
    classification: "Taller",
    modality: "Mixta",
    venue: "Sala de Conferencias B",
    startDate: "2024-03-20T10:00",
    endDate: "2024-03-22T16:00",
    hasCost: true,
    costDetails: "$500 MXN por participante",
    onlineInfo: "Enlace de Zoom será enviado por correo",
    organizers: "Dra. Ana Martínez; Mtro. Luis Pérez",
    status: "en_revision",
    certificateStatus: "sin_solicitar",
    createdAt: "2024-02-10T15:00:00Z",
    updatedAt: "2024-02-20T09:15:00Z",
    userId: "user1",
    cvFiles: [],
  },
  {
    id: "3",
    name: "Seminario de Nutrición Deportiva",
    responsible: "Lic. Roberto Silva",
    email: "roberto.silva@uabc.edu.mx",
    phone: "664-555-0123",
    program: "Nutrición",
    type: "Académico",
    classification: "Seminario",
    modality: "En línea",
    venue: "Plataforma virtual",
    startDate: "2024-04-05T14:00",
    endDate: "2024-04-05T18:00",
    hasCost: false,
    onlineInfo: "Microsoft Teams - Enlace por confirmar",
    organizers: "Lic. Roberto Silva",
    status: "borrador",
    certificateStatus: "sin_solicitar",
    createdAt: "2024-02-25T11:00:00Z",
    updatedAt: "2024-02-25T11:00:00Z",
    userId: "user1",
    cvFiles: [],
  },
  {
    id: "4",
    name: "Congreso de Medicina Preventiva",
    responsible: "Dr. Fernando López",
    email: "fernando.lopez@uabc.edu.mx",
    phone: "664-444-5555",
    program: "Médico",
    type: "Académico",
    classification: "Otro",
    classificationOther: "Congreso",
    modality: "Presencial",
    venue: "Centro de Convenciones UABC",
    startDate: "2024-05-10T08:00",
    endDate: "2024-05-12T18:00",
    hasCost: true,
    costDetails: "$1,200 MXN - Incluye material y certificado",
    organizers: "Dr. Fernando López; Dra. Carmen Ruiz; Mtro. José Hernández",
    observations: "Congreso internacional con ponentes de prestigio",
    status: "rechazado",
    certificateStatus: "sin_solicitar",
    createdAt: "2024-02-05T09:00:00Z",
    updatedAt: "2024-02-28T16:45:00Z",
    userId: "user1",
    cvFiles: [],
    rejectionReason:
      "El presupuesto propuesto excede los límites establecidos. Favor de revisar los costos y reenviar.",
    adminComments: "Revisar presupuesto y costos de ponentes internacionales.",
  },
  {
    id: "5",
    name: "Workshop de Terapia Cognitivo-Conductual",
    responsible: "Mtra. Patricia Morales",
    email: "patricia.morales@uabc.edu.mx",
    phone: "664-777-8888",
    program: "Psicología",
    type: "Académico",
    classification: "Taller",
    modality: "Presencial",
    venue: "Laboratorio de Psicología",
    startDate: "2024-04-15T09:00",
    endDate: "2024-04-16T17:00",
    hasCost: false,
    organizers: "Mtra. Patricia Morales; Lic. Sandra Vega",
    status: "aprobado",
    certificateStatus: "emitidas",
    createdAt: "2024-01-20T14:00:00Z",
    updatedAt: "2024-03-01T10:30:00Z",
    userId: "user1",
    cvFiles: [],
    adminComments: "Aprobado. Excelente propuesta para estudiantes de psicología.",
  },
  {
    id: "6",
    name: "Simposio de Investigación en Salud",
    responsible: "Dr. Miguel Ángel Torres",
    email: "miguel.torres@uabc.edu.mx",
    phone: "664-333-2222",
    program: "Posgrado",
    type: "Académico",
    classification: "Seminario",
    modality: "Mixta",
    venue: "Auditorio de Posgrado",
    startDate: "2024-06-01T10:00",
    endDate: "2024-06-02T16:00",
    hasCost: false,
    onlineInfo: "Transmisión en vivo por YouTube y Zoom para participantes remotos",
    organizers: "Dr. Miguel Ángel Torres; Dra. Elena Castillo; Dr. Ricardo Mendoza",
    observations: "Presentación de proyectos de investigación de estudiantes de posgrado",
    status: "en_revision",
    certificateStatus: "sin_solicitar",
    createdAt: "2024-03-01T11:00:00Z",
    updatedAt: "2024-03-05T09:20:00Z",
    userId: "user2",
    cvFiles: [],
  },
  {
    id: "7",
    name: "Jornada de Salud Mental Comunitaria",
    responsible: "Lic. Carmen Jiménez",
    email: "carmen.jimenez@uabc.edu.mx",
    phone: "664-666-7777",
    program: "Psicología",
    type: "Salud",
    classification: "Otro",
    classificationOther: "Jornada",
    modality: "Presencial",
    venue: "Plaza Cívica FMP",
    startDate: "2024-05-20T08:00",
    endDate: "2024-05-20T14:00",
    hasCost: false,
    organizers: "Lic. Carmen Jiménez; Estudiantes de Servicio Social",
    observations: "Actividad de vinculación con la comunidad",
    status: "aprobado",
    certificateStatus: "sin_solicitar",
    createdAt: "2024-02-15T13:00:00Z",
    updatedAt: "2024-03-10T11:15:00Z",
    userId: "user2",
    cvFiles: [],
    adminComments: "Aprobado. Excelente iniciativa de vinculación social.",
  },
]

// Mock functions for event management
export const getEventsByUser = (userId: string): Event[] => {
  return mockEvents.filter((event) => event.userId === userId)
}

export const getEventById = (id: string): Event | undefined => {
  return mockEvents.find((event) => event.id === id)
}

export const getEventsForReview = (): Event[] => {
  return mockEvents.filter((event) => event.status === "en_revision")
}

export const getEventsWithCertificateRequests = (): Event[] => {
  return mockEvents.filter(
    (event) =>
      event.status === "aprobado" &&
      (event.certificateStatus === "solicitadas" || event.certificateStatus === "emitidas"),
  )
}

export const createEvent = (eventData: any): Event => {
  const newEvent: Event = {
    ...eventData,
    id: Math.random().toString(36).substr(2, 9),
    status: "borrador" as const,
    certificateStatus: "sin_solicitar" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cvFiles: [],
  }
  mockEvents.push(newEvent)
  return newEvent
}

export const updateEvent = (id: string, updates: Partial<Event>): Event | null => {
  const eventIndex = mockEvents.findIndex((event) => event.id === id)
  if (eventIndex === -1) return null

  mockEvents[eventIndex] = {
    ...mockEvents[eventIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  return mockEvents[eventIndex]
}

export const updateEventStatus = (id: string, status: Event["status"], comments?: string): Event | null => {
  const event = mockEvents.find((e) => e.id === id)
  if (!event) return null

  event.status = status
  event.updatedAt = new Date().toISOString()

  if (status === "rechazado" && comments) {
    event.rejectionReason = comments
  }
  if (comments) {
    event.adminComments = comments
  }

  return event
}

export const submitEventForReview = (id: string): Event | null => {
  return updateEvent(id, { status: "en_revision" })
}

export const requestCertificates = (id: string, requestData: any): Event | null => {
  return updateEvent(id, {
    certificateStatus: "solicitadas",
    // In a real app, you'd store the request data
  })
}

// Utility functions for statistics and filtering
export const getEventStatistics = () => {
  const total = mockEvents.length
  const byStatus = {
    borrador: mockEvents.filter((e) => e.status === "borrador").length,
    en_revision: mockEvents.filter((e) => e.status === "en_revision").length,
    aprobado: mockEvents.filter((e) => e.status === "aprobado").length,
    rechazado: mockEvents.filter((e) => e.status === "rechazado").length,
  }
  const byCertificateStatus = {
    sin_solicitar: mockEvents.filter((e) => e.certificateStatus === "sin_solicitar").length,
    solicitadas: mockEvents.filter((e) => e.certificateStatus === "solicitadas").length,
    emitidas: mockEvents.filter((e) => e.certificateStatus === "emitidas").length,
  }

  return { total, byStatus, byCertificateStatus }
}

export const searchEvents = (
  query: string,
  filters?: {
    program?: string
    status?: string
    startDate?: string
    endDate?: string
  },
): Event[] => {
  let filtered = mockEvents

  // Apply text search
  if (query) {
    const searchLower = query.toLowerCase()
    filtered = filtered.filter(
      (event) =>
        event.name.toLowerCase().includes(searchLower) ||
        event.responsible.toLowerCase().includes(searchLower) ||
        event.email.toLowerCase().includes(searchLower),
    )
  }

  // Apply filters
  if (filters?.program) {
    filtered = filtered.filter((event) => event.program === filters.program)
  }

  if (filters?.status && filters.status !== "all") {
    filtered = filtered.filter((event) => event.status === filters.status)
  }

  if (filters?.startDate) {
    filtered = filtered.filter((event) => new Date(event.startDate) >= new Date(filters.startDate!))
  }

  if (filters?.endDate) {
    filtered = filtered.filter((event) => new Date(event.startDate) <= new Date(filters.endDate!))
  }

  return filtered
}
