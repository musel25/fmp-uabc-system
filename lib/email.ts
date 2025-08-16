// Email notification utilities
interface NewEventNotification {
  eventName: string
  userName: string
  userEmail: string
  eventId: string
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