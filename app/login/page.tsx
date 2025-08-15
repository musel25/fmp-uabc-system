"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/ui/logo"
import { useToast } from "@/hooks/use-toast"
import { signIn, signUp, getAuthUser } from "@/lib/supabase-auth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isSignUp) {
        // Sign up new user
        if (!name.trim()) {
          toast({
            title: "Error",
            description: "Por favor, ingresa tu nombre completo",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        const { user, error } = await signUp(email, password, name)
        
        if (error) {
          toast({
            title: "Error de registro",
            description: error.message || "Error al crear la cuenta",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        toast({
          title: "Cuenta creada",
          description: "Revisa tu email para confirmar tu cuenta",
        })

        // Switch to login mode
        setIsSignUp(false)
        setName("")
      } else {
        // Sign in existing user
        const { user, error } = await signIn(email, password)
        
        if (error) {
          toast({
            title: "Error de autenticación",
            description: error.message || "Email o contraseña incorrectos",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        // Get complete user profile
        const authUser = await getAuthUser()
        
        if (!authUser) {
          toast({
            title: "Error",
            description: "No se pudo cargar el perfil de usuario",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        toast({
          title: "Inicio de sesión exitoso",
          description: `Bienvenido, ${authUser.name}`,
        })

        // Redirect based on role
        if (authUser.role === "admin") {
          router.push("/admin/review")
        } else {
          router.push("/dashboard")
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #006341 0%, #007850 50%, #008a60 100%)'
    }}>
      <Card className="w-full max-w-md card-uabc shadow-2xl border-0 backdrop-blur-sm bg-white/95">
        <CardHeader className="text-center space-y-4">
          <Logo className="justify-center" />
          <div>
            <CardTitle className="text-2xl font-bold text-foreground-strong">
              {isSignUp ? "Crear Cuenta" : "Iniciar Sesión"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">Sistema de Registro y Constancias</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Tu nombre completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu.email@uabc.edu.mx"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full"
              />
              {isSignUp && (
                <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
              )}
            </div>
            <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
              {isLoading 
                ? (isSignUp ? "Creando cuenta..." : "Iniciando sesión...") 
                : (isSignUp ? "Crear Cuenta" : "Ingresar")
              }
            </Button>
            
            <div className="text-center space-y-2">
              <button
                type="button"
                className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setName("")
                  setEmail("")
                  setPassword("")
                }}
              >
                {isSignUp ? "¿Ya tienes cuenta? Iniciar sesión" : "¿No tienes cuenta? Crear cuenta"}
              </button>
              
              {!isSignUp && (
                <div>
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    onClick={() =>
                      toast({
                        title: "Función no disponible",
                        description: "Contacta al administrador del sistema",
                      })
                    }
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
