import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Helper function to test database connection
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error && error.code === 'PGRST116') {
      // Table doesn't exist yet - this is expected before schema creation
      return { 
        success: true, 
        message: 'Connected to Supabase (tables not created yet)',
        needsSchema: true 
      }
    }
    
    if (error) {
      return { 
        success: false, 
        message: `Connection error: ${error.message}`,
        error 
      }
    }
    
    return { 
      success: true, 
      message: 'Successfully connected to Supabase database',
      needsSchema: false 
    }
  } catch (error) {
    return { 
      success: false, 
      message: `Unexpected error: ${error}`,
      error 
    }
  }
}