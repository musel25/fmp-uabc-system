# Email Configuration with Resend

This document explains how to set up email notifications for new event registrations using Resend.

## Setup Instructions

### 1. Environment Variable

Add your Resend API key to your environment variables:

**Local Development (.env.local):**
```bash
RESEND_API_KEY=your_resend_api_key_here
```

**Production (Vercel/Netlify/etc.):**
Add `RESEND_API_KEY` as an environment variable in your hosting platform.

### 2. Domain Configuration (Optional)

By default, emails are sent from `noreply@musel.dev`. To use your own domain:

1. Verify your domain in Resend dashboard
2. Update the `from` field in `/app/api/send-email/route.ts`:
   ```typescript
   from: 'Sistema FMP <noreply@yourdomain.com>',
   ```

### 3. Install Dependencies

The Resend package is already added to package.json. Install it:

```bash
npm install
```

## How It Works

### Automatic Email Notifications

When a new event is registered:

1. **Event Creation** - User submits event form
2. **Database Insert** - Event saved to Supabase
3. **Email Trigger** - `createEvent()` function calls `sendNewEventNotification()`
4. **Email API** - Makes POST request to `/api/send-email`
5. **Resend Service** - Sends email via Resend API
6. **Notification Sent** - Email delivered to `yaheko.pardo@uabc.edu.mx`

### Email Content

**To:** yaheko.pardo@uabc.edu.mx  
**Subject:** Nuevo evento registrado: {Event Name}  
**Content:**
- Event name and details
- User information (name and email)
- Event ID for reference
- Professional HTML formatting

### Fallback Behavior

If the Resend API key is not configured:
- Emails are logged to the console
- Event creation continues normally
- No errors are thrown

### Error Handling

- Email failures don't prevent event creation
- Errors are logged but don't interrupt the user flow
- Graceful degradation if email service is unavailable

## Testing

### Development Mode
Without API key: Emails are logged to console
With API key: Real emails are sent via Resend

### Production Mode
Always uses Resend API if key is configured

## Troubleshooting

### Email Not Sending
1. Check if `RESEND_API_KEY` is set correctly
2. Verify API key is valid in Resend dashboard
3. Check server logs for error messages
4. Ensure domain is verified (if using custom domain)

### API Key Issues
- Get your API key from: https://resend.com/api-keys
- Make sure it has send permissions
- Test the key in Resend's API playground

### Domain Verification
- For production, verify your sending domain in Resend
- Use a subdomain like `noreply@yourdomain.com`
- Update the `from` field in the API route accordingly