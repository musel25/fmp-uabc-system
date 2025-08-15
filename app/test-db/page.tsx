"use client"

import { useEffect, useState } from 'react'
import { testConnection } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ConnectionResult {
  success: boolean
  message: string
  needsSchema?: boolean
  error?: any
}

export default function TestDatabasePage() {
  const [result, setResult] = useState<ConnectionResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runTest = async () => {
    setIsLoading(true)
    setResult(null)
    
    try {
      const connectionResult = await testConnection()
      setResult(connectionResult)
    } catch (error) {
      setResult({
        success: false,
        message: `Failed to test connection: ${error}`,
        error
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    runTest()
  }, [])

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Supabase Database Connection Test</CardTitle>
          <CardDescription>
            Testing connection to your Supabase database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runTest} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Testing Connection...' : 'Test Connection'}
          </Button>

          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <Badge variant={result.success ? "default" : "destructive"}>
                  {result.success ? 'Connected' : 'Failed'}
                </Badge>
              </div>
              
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm">{result.message}</p>
              </div>

              {result.needsSchema && (
                <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50">
                  <p className="text-sm text-yellow-800">
                    ✅ Connection successful! Next step: Create database schema in Supabase SQL Editor.
                  </p>
                </div>
              )}

              {result.success && !result.needsSchema && (
                <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                  <p className="text-sm text-green-800">
                    ✅ Database is ready! All tables are created and accessible.
                  </p>
                </div>
              )}

              {result.error && (
                <details className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <summary className="text-sm font-medium text-red-800 cursor-pointer">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs text-red-700 overflow-auto">
                    {JSON.stringify(result.error, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Environment Check:</strong></p>
            <p>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
            <p>SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}