export type EventStatus = "en_revision" | "aprobado" | "rechazado"
export type CertificateStatus = "sin_solicitar" | "solicitadas" | "emitidas"
export type EventProgram = "Médico" | "Psicología" | "Nutrición" | "Posgrado"
export type EventType = "Académico" | "Cultural" | "Deportivo" | "Salud"
export type EventClassification = "Conferencia" | "Seminario" | "Taller" | "Otro"
export type EventModality = "Presencial" | "En línea" | "Mixta"


export interface Event {
  id: string
  name: string
  responsible?: string
  email?: string
  phone: string
  program: EventProgram
  type: EventType
  classification: EventClassification
  classificationOther?: string
  modality: EventModality
  venue: string
  startDate: string
  endDate: string
  hasCost: boolean
  costDetails?: string
  onlineInfo?: string
  organizers: string
  observations?: string
  programDetails: string
  speakerCvs: string
  codigosRequeridos: number
  status: EventStatus
  certificateStatus: CertificateStatus
  createdAt: string
  updatedAt: string
  userId: string
  adminComments?: string
  rejectionReason?: string
}

export interface CreateEventData {
  name: string
  responsible?: string
  email?: string
  phone: string
  program: EventProgram
  type: EventType
  classification: EventClassification
  classificationOther?: string
  modality: EventModality
  venue: string
  startDate: string
  endDate: string
  hasCost: boolean
  costDetails?: string
  onlineInfo?: string
  organizers: string
  observations?: string
  programDetails: string
  speakerCvs: string
  codigosRequeridos: number
}
