import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
}

// Sign up new user
export async function signUp(email: string, password: string, name: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    })

    if (error) throw error

    return { user: data.user, error: null }
  } catch (error) {
    console.error('Sign up error:', error)
    return { user: null, error }
  }
}

// Sign in user
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error

  return { user: data.user, error: null }
}

// Sign out user
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Sign out error:', error)
    return { error }
  }
}

// Get current user session
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

// Get user profile from profiles table
export async function getUserProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Get user profile error:', error)
    return null
  }
}

// Get complete auth user (user + profile)
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    const profile = await getUserProfile(user.id)
    if (!profile) return null

    return {
      id: user.id,
      email: profile.email,
      name: profile.name,
      role: profile.role
    }
  } catch (error) {
    console.error('Get auth user error:', error)
    return null
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return !!user
}

// Check if user is admin
export async function isAdmin(): Promise<boolean> {
  try {
    const authUser = await getAuthUser()
    return authUser?.role === 'admin'
  } catch (error) {
    console.error('Is admin check error:', error)
    return false
  }
}

// Update user profile
export async function updateProfile(userId: string, updates: Partial<Profile>) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return { profile: data, error: null }
  } catch (error) {
    console.error('Update profile error:', error)
    return { profile: null, error }
  }
}

// Listen to auth state changes
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null)
  })
}

// Send password reset email
export async function sendPasswordResetEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

// Update user password
export async function updateUserPassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
}