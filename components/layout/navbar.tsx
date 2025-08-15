"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/ui/logo"
import { LogOut, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAuthUser, signOut } from "@/lib/supabase-auth"
import type { AuthUser } from "@/lib/supabase-auth"

interface NavbarProps {
  showAdminToggle?: boolean
}

export function Navbar({ showAdminToggle = false }: NavbarProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const loadUser = async () => {
      const authUser = await getAuthUser()
      if (authUser) {
        setUser(authUser)
      }
    }
    loadUser()
  }, [])

  const handleLogout = async () => {
    try {
      await signOut()
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      })
      router.push("/login")
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cerrar sesión",
        variant: "destructive",
      })
    }
  }

  const toggleAdminMode = () => {
    setIsAdminMode(!isAdminMode)
    if (!isAdminMode) {
      router.push("/admin/review")
    } else {
      router.push("/dashboard")
    }
    toast({
      title: isAdminMode ? "Modo Usuario" : "Modo Administrador",
      description: isAdminMode ? "Cambiaste a vista de usuario" : "Cambiaste a vista de administrador",
    })
  }

  if (!user) return null

  return (
    <nav className="bg-primary text-primary-foreground shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Logo className="text-primary-foreground" />
            {showAdminToggle && user.role === "admin" && (
              <div className="flex items-center space-x-2">
                <Badge variant={isAdminMode ? "secondary" : "outline"} className="text-xs">
                  {isAdminMode ? "Admin" : "Usuario"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAdminMode}
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Shield className="h-4 w-4 mr-1" />
                  {isAdminMode ? "Vista Usuario" : "Vista Admin"}
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium hidden sm:block">{user.name}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary-foreground text-primary">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
