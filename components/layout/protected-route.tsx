"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAuthUser, onAuthStateChange } from "@/lib/supabase-auth"
import type { AuthUser } from "@/lib/supabase-auth"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        const authUser = await getAuthUser()
        
        if (!mounted) return

        if (!authUser) {
          router.push("/login")
          return
        }

        if (requireAdmin && authUser.role !== "admin") {
          router.push("/dashboard")
          return
        }

        setUser(authUser)
      } catch (error) {
        console.error('Auth check error:', error)
        if (mounted) {
          router.push("/login")
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    // Initial auth check
    checkAuth()

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange(async (supabaseUser) => {
      if (!mounted) return

      if (!supabaseUser) {
        router.push("/login")
        return
      }

      // Re-check auth when user state changes
      checkAuth()
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router, requireAdmin])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
