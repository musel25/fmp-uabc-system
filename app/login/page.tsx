"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Check for error messages in URL parameters
  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      toast({
        title: "Error de autenticación",
        description: error,
        variant: "destructive",
      })
    }
  }, [searchParams, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

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
          let errorTitle = "Error de registro"
          let errorDescription = "Error al crear la cuenta"
          
          // Handle specific signup error types - check both message and error string
          const errorMessage = error.message || error.toString() || ''
          
          if (errorMessage.includes("User already registered") || errorMessage.includes("already_registered")) {
            errorTitle = "Email ya registrado"
            errorDescription = "Ya existe una cuenta con este email. ¿Quieres iniciar sesión?"
          } else if (errorMessage.includes("Password should be at least") || errorMessage.includes("password_too_short")) {
            errorTitle = "Contraseña muy corta"
            errorDescription = "La contraseña debe tener al menos 6 caracteres."
          } else if (errorMessage.includes("Invalid email") || errorMessage.includes("invalid_email")) {
            errorTitle = "Email inválido"
            errorDescription = "El formato del email no es válido."
          } else if (errorMessage.includes("Password") || errorMessage.includes("password")) {
            errorTitle = "Error de contraseña"
            errorDescription = "La contraseña no cumple con los requisitos de seguridad."
          } else if (errorMessage) {
            // Use the original error message for other cases
            errorDescription = errorMessage
          }
          
          toast({
            title: errorTitle,
            description: errorDescription,
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        toast({
          title: "Cuenta creada exitosamente",
          description: "Se ha enviado un email de confirmación a tu correo. Debes confirmar tu email antes de poder iniciar sesión.",
        })

        // Show confirmation message
        setShowConfirmation(true)
        
        // Switch to login mode after a delay to allow user to see the message
        setTimeout(() => {
          setIsSignUp(false)
          setShowConfirmation(false)
          setName("")
        }, 5000) // 5 second delay
      } else {
        // Sign in existing user
        const { user, error } = await signIn(email, password)
        
        if (error) {
          let errorTitle = "Error de autenticación"
          let errorDescription = "Email o contraseña incorrectos"
          
          // Handle specific error types - check both message and error string
          const errorMessage = error.message || error.toString() || JSON.stringify(error) || ''
          
          // Normalize the error message to lowercase for easier matching
          const normalizedError = errorMessage.toLowerCase()
          
          if (normalizedError.includes("invalid login credentials") || normalizedError.includes("invalid_credentials")) {
            errorTitle = "Credenciales incorrectas"
            errorDescription = "El email o la contraseña son incorrectos. Verifica tus datos."
          } else if (normalizedError.includes("email not confirmed") || normalizedError.includes("email_not_confirmed")) {
            errorTitle = "Email no confirmado"
            errorDescription = "Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada."
          } else if (normalizedError.includes("user not found") || normalizedError.includes("user_not_found")) {
            errorTitle = "Usuario no encontrado"
            errorDescription = "No existe una cuenta con este email. ¿Necesitas crear una cuenta?"
          } else if (normalizedError.includes("too many requests") || normalizedError.includes("rate limit")) {
            errorTitle = "Demasiados intentos"
            errorDescription = "Has hecho demasiados intentos de inicio de sesión. Espera unos minutos e intenta de nuevo."
          } else if (normalizedError.includes("invalid email") || normalizedError.includes("invalid_email")) {
            errorTitle = "Email inválido"
            errorDescription = "El formato del email no es válido."
          } else if (normalizedError.includes("password")) {
            errorTitle = "Error de contraseña"
            errorDescription = "La contraseña es incorrecta. Inténtalo de nuevo."
          } else if (errorMessage && errorMessage !== '[object Object]') {
            // Use the original error message for other cases (avoid showing [object Object])
            errorDescription = `Error de autenticación: ${errorMessage}`
          }
          
          toast({
            title: errorTitle,
            description: errorDescription,
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        // Check if login was actually successful
        if (!user) {
          toast({
            title: "Error de autenticación",
            description: "No se pudo iniciar sesión. Verifica tus credenciales.",
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
      const errorMessage = (error as Error).message || "Ocurrió un error inesperado"
      setError(errorMessage)
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
          <Logo className="justify-center" textColor="text-primary" dotColor="text-muted-foreground" />
          <div>
            <CardTitle className="text-2xl font-bold text-foreground-strong">
              {isSignUp ? "Crear Cuenta" : "Iniciar Sesión"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">Sistema de Registro y Constancias</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {showConfirmation && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">¡Cuenta creada exitosamente!</h3>
                  <p className="mt-1 text-sm text-green-700">
                    Se ha enviado un email de confirmación a <strong>{email}</strong>. 
                    Debes confirmar tu email antes de poder iniciar sesión.
                  </p>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
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
                  setShowConfirmation(false)
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
