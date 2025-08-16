"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/ui/logo"
import { useToast } from "@/hooks/use-toast"
import { sendPasswordResetEmail } from "@/lib/supabase-auth"
import Link from "next/link"
import { Footer } from "@/components/layout/footer"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await sendPasswordResetEmail(email)
      setIsSent(true)
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{
      background: 'linear-gradient(135deg, #006341 0%, #007850 50%, #008a60 100%)'
    }}>
      <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md card-uabc shadow-2xl border-0 backdrop-blur-sm bg-white/95">
        <CardHeader className="text-center space-y-4">
          <Logo className="justify-center" textColor="text-primary" dotColor="text-muted-foreground" />
          <div>
            <CardTitle className="text-2xl font-bold text-foreground-strong">
              ¿Olvidaste tu Contraseña?
            </CardTitle>
            <CardDescription className="text-muted-foreground">Ingresa tu email para recibir un enlace de recuperación</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isSent ? (
            <div className="text-center">
              <p className="text-green-700">
                Se ha enviado un enlace de recuperación a tu correo electrónico.
              </p>
              <Link href="/login" className="text-primary hover:underline mt-4 block">
                Volver a Iniciar Sesión
              </Link>
            </div>
          ) : (
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
              <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Enviar Enlace de Recuperación"}
              </Button>
              <div className="text-center">
                <Link href="/login" className="text-sm text-primary hover:underline">
                  Volver a Iniciar Sesión
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      </div>
      <Footer />
    </div>
  )
}
