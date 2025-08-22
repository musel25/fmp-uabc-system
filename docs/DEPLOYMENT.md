# Deployment Guide

## Overview

This guide covers deploying the FMP-UABC Event Management System to production using Vercel and Supabase. The application is designed for cloud-native deployment with minimal configuration.

## Prerequisites

### Required Services
- **Vercel Account**: For hosting the Next.js application
- **Supabase Account**: For database and authentication
- **Resend Account**: For email notifications
- **Domain Access**: For custom domain configuration (optional)

### Local Setup
- Node.js 18+ installed
- Git repository access
- Environment variables configured

## Supabase Setup

### 1. Create Supabase Project

```bash
# 1. Go to https://supabase.com
# 2. Create new project
# 3. Choose region (closest to users)
# 4. Set strong database password
```

### 2. Database Schema Setup

```sql
-- Run in Supabase SQL Editor
-- Copy contents from schema.sql

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies (see DATABASE.md for complete policies)
CREATE POLICY "Users can view own events" ON events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all events" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
```

### 3. Authentication Configuration

```bash
# In Supabase Dashboard -> Authentication -> Settings

# Site URL (for production)
https://your-domain.com

# Redirect URLs
https://your-domain.com/dashboard
https://your-domain.com/admin/review

# Email Templates (optional customization)
# - Confirm signup
# - Reset password
# - Magic link
```

### 4. Environment Variables

Get from Supabase Dashboard -> Settings -> API:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Resend Email Setup

### 1. Create Resend Account

```bash
# 1. Go to https://resend.com
# 2. Create account
# 3. Verify domain (optional for custom sender)
# 4. Generate API key
```

### 2. Configure Environment Variables

```env
RESEND_API_KEY=re_your_api_key

# Optional: Custom sender domain
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### 3. DNS Configuration (Custom Domain)

If using custom domain for email:

```dns
# Add MX record
yourdomain.com MX 10 feedback-smtp.resend.com

# Add DKIM records (provided by Resend)
resend._domainkey.yourdomain.com TXT "v=DKIM1; k=rsa; p=your_public_key"
```

## Vercel Deployment

### 1. Project Setup

```bash
# Connect repository to Vercel
# Option 1: Vercel CLI
npm i -g vercel
vercel login
vercel

# Option 2: Vercel Dashboard
# - Import Git Repository
# - Select your repository
# - Configure build settings
```

### 2. Build Configuration

Vercel auto-detects Next.js, but verify settings:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### 3. Environment Variables

Add in Vercel Dashboard -> Settings -> Environment Variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Resend
RESEND_API_KEY=re_...

# Application
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NODE_ENV=production

# Analytics (optional)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

### 4. Deployment

```bash
# Automatic deployment on git push
git add .
git commit -m "deploy: initial production deployment"
git push origin main

# Manual deployment
vercel --prod
```

## Custom Domain Setup

### 1. Add Domain in Vercel

```bash
# Vercel Dashboard -> Project -> Settings -> Domains
# Add: yourdomain.com
# Add: www.yourdomain.com (optional)
```

### 2. DNS Configuration

Configure your DNS provider:

```dns
# Option 1: Nameservers (recommended)
ns1.vercel-dns.com
ns2.vercel-dns.com

# Option 2: A Records
yourdomain.com A 76.76.19.61
www.yourdomain.com CNAME cname.vercel-dns.com

# Option 3: CNAME (subdomain only)
subdomain.yourdomain.com CNAME cname.vercel-dns.com
```

### 3. SSL Certificate

Vercel automatically provisions SSL certificates:
- Let's Encrypt certificates
- Automatic renewal
- HTTPS redirection enabled by default

## Production Configuration

### 1. Next.js Configuration

Update `next.config.mjs` for production:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove these for production
  eslint: {
    ignoreDuringBuilds: false, // Enable linting
  },
  typescript: {
    ignoreBuildErrors: false, // Enable type checking
  },
  
  // Production optimizations
  images: {
    domains: ['your-supabase-project.supabase.co'],
    unoptimized: false, // Enable image optimization
  },
  
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    legacyBrowsers: false,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

### 2. Environment-Specific Configuration

```typescript
// lib/config.ts
const config = {
  development: {
    logLevel: 'debug',
    enableAnalytics: false,
  },
  production: {
    logLevel: 'error',
    enableAnalytics: true,
  },
}

export const appConfig = config[process.env.NODE_ENV as keyof typeof config]
```

### 3. Error Monitoring

Add error monitoring service (optional):

```bash
# Option 1: Sentry
npm install @sentry/nextjs

# Configure in next.config.js
const { withSentryConfig } = require('@sentry/nextjs')

# Option 2: LogRocket
npm install logrocket
npm install logrocket-react
```

## Database Migration

### 1. Schema Updates

```sql
-- Create migration files for schema changes
-- migrations/001_initial_schema.sql
-- migrations/002_add_new_fields.sql

-- Apply migrations in order
-- Use Supabase Dashboard -> SQL Editor
```

### 2. Data Migration

```typescript
// scripts/migrate-data.ts
import { supabase } from '@/lib/supabase'

async function migrateData() {
  // Example: Update existing events
  const { data, error } = await supabase
    .from('events')
    .update({ new_field: 'default_value' })
    .is('new_field', null)
  
  console.log('Migration complete:', data?.length, 'records updated')
}
```

### 3. Rollback Strategy

```sql
-- Create rollback scripts
-- rollbacks/001_rollback_initial_schema.sql

-- Test rollbacks in staging environment first
```

## Monitoring and Maintenance

### 1. Vercel Analytics

```typescript
// Enable in vercel.json
{
  "analytics": {
    "enable": true
  }
}

// Or via package
npm install @vercel/analytics
```

### 2. Performance Monitoring

```typescript
// lib/monitoring.ts
export function trackPageView(page: string) {
  if (process.env.NODE_ENV === 'production') {
    // Track with your analytics service
  }
}

export function trackError(error: Error, context?: object) {
  if (process.env.NODE_ENV === 'production') {
    // Send to error tracking service
    console.error('Production error:', error, context)
  }
}
```

### 3. Health Checks

Create health check endpoint:

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { testConnection } from '@/lib/supabase'

export async function GET() {
  try {
    const dbCheck = await testConnection()
    
    if (!dbCheck.success) {
      return NextResponse.json(
        { status: 'unhealthy', error: dbCheck.message },
        { status: 503 }
      )
    }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown'
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Internal server error' },
      { status: 503 }
    )
  }
}
```

## Security Configuration

### 1. Environment Security

```bash
# Use Vercel environment variables for secrets
# Never commit sensitive data to git
# Use different keys for development/production
```

### 2. Content Security Policy

```typescript
// next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "connect-src 'self' https://*.supabase.co https://api.resend.com",
            ].join('; '),
          },
        ],
      },
    ]
  },
}
```

### 3. Rate Limiting

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: /* redis instance */,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
})

export async function middleware(request: NextRequest) {
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const identifier = request.ip ?? '127.0.0.1'
    const { success } = await ratelimit.limit(identifier)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }
  }
  
  return NextResponse.next()
}
```

## Backup and Disaster Recovery

### 1. Database Backups

```bash
# Supabase provides automated backups
# Point-in-time recovery available
# Manual backup triggers via API

# Export data
curl -X GET 'https://your-project.supabase.co/rest/v1/events' \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-token" > events-backup.json
```

### 2. Code Backup

```bash
# Git repository serves as code backup
# Multiple git remotes recommended
git remote add backup git@backup-server:fmp-uabc-system.git
git push backup main
```

### 3. Recovery Procedures

```bash
# 1. Restore database from Supabase backup
# 2. Redeploy application from git
# 3. Update DNS if needed
# 4. Verify functionality

# Recovery checklist:
# - Database connectivity
# - Authentication flow
# - Email sending
# - File uploads (if implemented)
```

## Performance Optimization

### 1. Build Optimization

```javascript
// next.config.mjs
const nextConfig = {
  // Bundle analyzer
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    return config
  },
  
  // Compression
  compress: true,
  
  // Static optimization
  generateEtags: true,
  
  // Power user features
  experimental: {
    optimizeCss: true,
    swcMinify: true,
  },
}
```

### 2. Caching Strategy

```typescript
// Enable Next.js caching
export const revalidate = 3600 // 1 hour

// API route caching
export async function GET() {
  const response = NextResponse.json(data)
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
  return response
}
```

### 3. Database Optimization

```sql
-- Add indexes for performance
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_created_at ON events(created_at DESC);

-- Query optimization
EXPLAIN ANALYZE SELECT * FROM events WHERE status = 'en_revision';
```

## Troubleshooting

### Common Deployment Issues

#### Build Failures
```bash
# TypeScript errors
npm run type-check

# Lint errors
npm run lint

# Missing dependencies
npm install

# Check build logs in Vercel dashboard
```

#### Environment Variables
```bash
# Verify variables are set
vercel env ls

# Add missing variables
vercel env add RESEND_API_KEY

# Check variable values
echo $NEXT_PUBLIC_SUPABASE_URL
```

#### Database Connection
```bash
# Test connection
curl https://your-app.vercel.app/api/health

# Check Supabase status
# https://status.supabase.com

# Verify connection strings
```

### Performance Issues

#### Slow Queries
```sql
-- Enable query logging in Supabase
-- Check slow query logs
-- Add appropriate indexes
```

#### Large Bundle Size
```bash
# Analyze bundle
npx @next/bundle-analyzer

# Optimize imports
# Use dynamic imports for heavy components
```

### Email Delivery Issues

#### Resend Configuration
```bash
# Verify API key
# Check domain verification
# Review email templates
# Monitor sending logs
```

## Staging Environment

### 1. Separate Staging Setup

```bash
# Create staging branch
git checkout -b staging

# Deploy to staging environment
vercel --target staging

# Use staging database
# Separate environment variables
```

### 2. Testing Checklist

- [ ] Authentication flow
- [ ] Event creation and editing
- [ ] Admin approval workflow
- [ ] Email notifications
- [ ] Certificate requests
- [ ] Mobile responsiveness
- [ ] Performance metrics

### 3. Production Deployment

```bash
# Deploy staging to production
git checkout main
git merge staging
git push origin main

# Monitor deployment
vercel --logs

# Verify functionality
curl https://your-domain.com/api/health
```

This deployment guide provides comprehensive instructions for deploying the FMP-UABC system to production with proper monitoring, security, and maintenance procedures.