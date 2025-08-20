// Email notification utilities
interface NewEventNotification {
  eventName: string
  userName: string
  userEmail: string
  eventId: string
}

interface EventApprovedNotification {
  eventName: string
  userName: string
  userEmail: string
  eventId: string
}

interface AdminCodesNotification {
  eventName: string
  eventId: string
  codigosRequeridos: number
  startDate: string
  endDate: string
  venue: string
  type: string
  classification: string
  classificationOther?: string
  programDetails: string
}

// Send email notification for new event registration
export async function sendNewEventNotification(data: NewEventNotification): Promise<void> {
  try {
    // In production, this would use a service like Resend, SendGrid, or similar
    // For now, we'll use a simple fetch to an API route
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'yaheko.pardo@uabc.edu.mx',
        subject: `Nuevo evento registrado: ${data.eventName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #006341;">Nuevo Evento Registrado</h2>
            <p>Se ha registrado un nuevo evento en el sistema:</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #006341;">${data.eventName}</h3>
              <p><strong>Registrado por:</strong> ${data.userName}</p>
              <p><strong>Email del usuario:</strong> ${data.userEmail}</p>
              <p><strong>ID del evento:</strong> ${data.eventId}</p>
            </div>
            
            <p>El evento está pendiente de revisión administrativa.</p>
            
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Este es un mensaje automático del Sistema de Registro y Constancias - FMP UABC
            </p>
          </div>
        `,
        text: `
Nuevo Evento Registrado

Se ha registrado un nuevo evento en el sistema:

Evento: ${data.eventName}
Registrado por: ${data.userName}
Email del usuario: ${data.userEmail}
ID del evento: ${data.eventId}

El evento está pendiente de revisión administrativa.

---
Sistema de Registro y Constancias - FMP UABC
        `.trim()
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to send email: ${response.status} ${response.statusText} ${JSON.stringify(errorData)}`)
    }

    console.log('Email notification sent successfully for event:', data.eventName)
  } catch (error) {
    // Log the error but don't throw it - we don't want email failures to break event creation
    console.error('Failed to send email notification:', error)
    console.error('Event data:', data)
  }
}

// Send email notification when event is approved
export async function sendEventApprovedNotification(data: EventApprovedNotification): Promise<void> {
  try {
    // Send email to the event creator
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: data.userEmail,
        subject: `Tu evento "${data.eventName}" fue aprobado`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #006341;">¡Tu evento fue aprobado!</h2>
            <p>Hola ${data.userName},</p>
            <p>Te informamos que tu evento ha sido aprobado por el equipo administrativo:</p>
            
            <div style="background-color: #f0f8f0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #006341;">
              <h3 style="margin-top: 0; color: #006341;">${data.eventName}</h3>
              <p><strong>Estado:</strong> <span style="color: #006341; font-weight: bold;">Aprobado ✓</span></p>
              <p><strong>ID del evento:</strong> ${data.eventId}</p>
            </div>
            
            <p>Ahora puedes proceder con la organización de tu evento. Una vez que termine, podrás solicitar las constancias correspondientes desde tu panel de eventos.</p>
            
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            
            <p>¡Felicidades y que tengas un excelente evento!</p>
            
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Este es un mensaje automático del Sistema de Registro y Constancias - FMP UABC
            </p>
          </div>
        `,
        text: `
¡Tu evento fue aprobado!

Hola ${data.userName},

Te informamos que tu evento ha sido aprobado por el equipo administrativo:

Evento: ${data.eventName}
Estado: Aprobado ✓
ID del evento: ${data.eventId}

Ahora puedes proceder con la organización de tu evento. Una vez que termine, podrás solicitar las constancias correspondientes desde tu panel de eventos.

Si tienes alguna pregunta, no dudes en contactarnos.

¡Felicidades y que tengas un excelente evento!

---
Sistema de Registro y Constancias - FMP UABC
        `.trim()
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to send email: ${response.status} ${response.statusText} ${JSON.stringify(errorData)}`)
    }

    console.log('Event approval notification sent successfully for event:', data.eventName)
  } catch (error) {
    // Log the error but don't throw it - we don't want email failures to break event approval
    console.error('Failed to send event approval notification:', error)
    console.error('Event data:', data)
  }
}

// Helper function to format date and time from ISO string
function formatEventDateTime(dateString: string): { date: string, time: string } {
  const date = new Date(dateString)
  const dateFormatted = date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const timeFormatted = date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  return { date: dateFormatted, time: timeFormatted }
}

// Helper function to map event type to category
function mapEventTypeToCategory(type: string, classification: string, classificationOther?: string): string {
  // Map the event type to the required categories
  const typeMap: { [key: string]: string } = {
    'Cultural': 'Cultural',
    'Deportivo': 'Deportivo',
    'Académico': 'Académico',
    'Salud': 'Salud'
  }
  
  // If it's "Otro" classification, use classificationOther if available
  if (classification === 'Otro' && classificationOther) {
    // Try to map common "other" classifications
    const otherLower = classificationOther.toLowerCase()
    if (otherLower.includes('musical') || otherLower.includes('música')) {
      return 'Musical'
    }
    if (otherLower.includes('tecnológ') || otherLower.includes('tecnolog')) {
      return 'Tecnológico'
    }
    return `Other: ${classificationOther}`
  }
  
  return typeMap[type] || 'Other: ' + type
}

// Send email notification to admin about required codes when event is approved
export async function sendAdminCodesNotification(data: AdminCodesNotification): Promise<void> {
  try {
    // Format the event dates and times
    const startDateTime = formatEventDateTime(data.startDate)
    const endDateTime = formatEventDateTime(data.endDate)
    
    // Determine the date period
    const dateRange = data.startDate.split('T')[0] === data.endDate.split('T')[0] 
      ? startDateTime.date 
      : `${startDateTime.date} - ${endDateTime.date}`
    
    // Map category
    const category = mapEventTypeToCategory(data.type, data.classification, data.classificationOther)
    
    // Truncate description to 250 characters
    const description = data.programDetails.length > 250 
      ? data.programDetails.substring(0, 250) + '...'
      : data.programDetails

    // Send email to admin about required codes
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'serafin.idanya@uabc.edu.mx',
        subject: 'Códigos 8=1',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
            <h2 style="color: #006341;">Evento Aprobado - Códigos Requeridos</h2>
            <p>Se ha aprobado un nuevo evento que requiere códigos:</p>
            
            <div style="background-color: #f5f5f5; padding: 25px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #006341; margin-bottom: 20px;">INFORMACIÓN DEL EVENTO</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; vertical-align: top; font-weight: bold; width: 40%;">NOMBRE:</td>
                  <td style="padding: 8px 0;">${data.eventName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; vertical-align: top; font-weight: bold;">Fecha o período de realización del evento:</td>
                  <td style="padding: 8px 0;">${dateRange}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; vertical-align: top; font-weight: bold;">HORA:</td>
                  <td style="padding: 8px 0;">${startDateTime.time}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; vertical-align: top; font-weight: bold;">Time (hora en formato HH:MM):</td>
                  <td style="padding: 8px 0;">${startDateTime.time}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; vertical-align: top; font-weight: bold;">LUGAR:</td>
                  <td style="padding: 8px 0;">${data.venue}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; vertical-align: top; font-weight: bold;">CATEGORÍA:</td>
                  <td style="padding: 8px 0;">${category}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; vertical-align: top; font-weight: bold;">CANTIDAD DE CÓDIGOS SOLICITADOS:</td>
                  <td style="padding: 8px 0; color: #006341; font-weight: bold;">${data.codigosRequeridos}</td>
                </tr>
              </table>
              
              <div style="margin-top: 20px;">
                <h4 style="color: #006341; margin-bottom: 10px;">Descripción general del evento (máximo 250 caracteres):</h4>
                <p style="background-color: #fff; padding: 15px; border-left: 4px solid #006341; margin: 0;">${description}</p>
              </div>
              
              <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #cc8a00;">
                <p style="margin: 0; font-size: 14px;"><strong>Nota:</strong> Cada actividad debe tener una duración mínima de 1 hora</p>
              </div>
            </div>
            
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Este es un mensaje automático del Sistema de Registro y Constancias - FMP UABC<br>
              ID del evento: ${data.eventId}
            </p>
          </div>
        `,
        text: `
Evento Aprobado - Códigos Requeridos

Se ha aprobado un nuevo evento que requiere códigos:

INFORMACIÓN DEL EVENTO
========================

NOMBRE: ${data.eventName}

Fecha o período de realización del evento: ${dateRange}

HORA: ${startDateTime.time}

Time (hora en formato HH:MM): ${startDateTime.time}

LUGAR: ${data.venue}

CATEGORÍA: ${category}

CANTIDAD DE CÓDIGOS SOLICITADOS: ${data.codigosRequeridos}

Descripción general del evento (máximo 250 caracteres):
${description}

NOTA: Cada actividad debe tener una duración mínima de 1 hora

---
Sistema de Registro y Constancias - FMP UABC
ID del evento: ${data.eventId}
        `.trim()
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to send email: ${response.status} ${response.statusText} ${JSON.stringify(errorData)}`)
    }

    console.log('Admin codes notification sent successfully for event:', data.eventName)
  } catch (error) {
    // Log the error but don't throw it - we don't want email failures to break event approval
    console.error('Failed to send admin codes notification:', error)
    console.error('Event data:', data)
  }
}