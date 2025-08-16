"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/ui/logo"
import { useToast } from "@/hooks/use-toast"
import { updateUserPassword } from "@/lib/supabase-auth"
import Link from "next/link"
import { Footer } from "@/components/layout/footer"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await updateUserPassword(password)
      toast({
        title: "Éxito",
        description: "Tu contraseña ha sido actualizada. Ahora puedes iniciar sesión.",
      })
      router.push("/login")
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
              Restablecer Contraseña
            </CardTitle>
            <CardDescription className="text-muted-foreground">Ingresa tu nueva contraseña</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full"
              />
            </div>
            <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
              {isLoading ? "Restableciendo..." : "Restablecer Contraseña"}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
      <Footer />
    </div>
  )
}
