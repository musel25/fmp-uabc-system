import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, text } = await request.json()

    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      )
    }

    // Check if Resend API key is configured
    const resendApiKey = process.env.RESEND_API_KEY
    
    if (!resendApiKey) {
      console.log('=== EMAIL NOTIFICATION (RESEND API KEY NOT CONFIGURED) ===')
      console.log('To:', to)
      console.log('Subject:', subject)
      console.log('HTML Content:')
      console.log(html)
      console.log('Text Content:')
      console.log(text)
      console.log('============================================================')
      
      return NextResponse.json(
        { 
          success: true, 
          message: 'Email logged (Resend API key not configured)',
          note: 'Add RESEND_API_KEY environment variable to send real emails'
        },
        { status: 200 }
      )
    }

    // Initialize Resend
    const resend = new Resend(resendApiKey)
    
    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Sistema FMP <noreply@resend.dev>',
      to: [to],
      subject,
      html,
      text
    })
    
    if (error) {
      console.error('Resend error:', error)
      throw new Error(`Resend error: ${JSON.stringify(error)}`)
    }

    console.log('Email sent successfully via Resend:', data?.id)

    return NextResponse.json(
      { 
        success: true, 
        message: 'Email sent successfully via Resend',
        emailId: data?.id
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Email API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}