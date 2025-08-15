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

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate authentication delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock authentication logic
    if (email && password) {
      // Store user session in localStorage (mock)
      const userData = {
        email,
        name: email.includes("admin") ? "Administrador FMP" : "Usuario FMP",
        role: email.includes("admin") ? "admin" : "user",
        id: Math.random().toString(36).substr(2, 9),
      }

      localStorage.setItem("fmp-user", JSON.stringify(userData))

      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${userData.name}`,
      })

      // Redirect based on role
      if (userData.role === "admin") {
        router.push("/admin/review")
      } else {
        router.push("/dashboard")
      }
    } else {
      toast({
        title: "Error de autenticación",
        description: "Por favor, ingresa tu email y contraseña",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-soft p-4">
      <Card className="w-full max-w-md card-uabc">
        <CardHeader className="text-center space-y-4">
          <Logo className="justify-center" />
          <div>
            <CardTitle className="text-2xl font-bold text-foreground-strong">Iniciar Sesión</CardTitle>
            <CardDescription className="text-muted-foreground">Sistema de Registro y Constancias</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full"
              />
            </div>
            <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Ingresar"}
            </Button>
            <div className="text-center">
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
          </form>
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Usuarios de prueba:</p>
            <p className="text-xs text-muted-foreground">Usuario: user@uabc.edu.mx</p>
            <p className="text-xs text-muted-foreground">Admin: admin@uabc.edu.mx</p>
            <p className="text-xs text-muted-foreground">Contraseña: cualquiera</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
