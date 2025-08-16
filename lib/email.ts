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

// Send email notification to admin about required codes when event is approved
export async function sendAdminCodesNotification(data: AdminCodesNotification): Promise<void> {
  try {
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
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #006341;">Evento Aprobado - Códigos Requeridos</h2>
            <p>Se ha aprobado un nuevo evento que requiere códigos:</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #006341;">${data.eventName}</h3>
              <p><strong>ID del evento:</strong> ${data.eventId}</p>
              <p><strong>Códigos requeridos:</strong> ${data.codigosRequeridos}</p>
            </div>
            
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Este es un mensaje automático del Sistema de Registro y Constancias - FMP UABC
            </p>
          </div>
        `,
        text: `
Evento Aprobado - Códigos Requeridos

Se ha aprobado un nuevo evento que requiere códigos:

Evento: ${data.eventName}
ID del evento: ${data.eventId}
Códigos requeridos: ${data.codigosRequeridos}

---
Sistema de Registro y Constancias - FMP UABC
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