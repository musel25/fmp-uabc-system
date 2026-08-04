import type React from "react"
import { Header } from "@/components/layout/header"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { cn } from "@/lib/utils"

/**
 * Marco común de las pantallas autenticadas: cabecera institucional,
 * navegación, contenido y pie. Antes cada página lo repetía, y ya se habían
 * ido separando entre sí (la de detalle, por ejemplo, había perdido la
 * cabecera).
 */
export function AppShell({
  children,
  showAdminToggle = false,
  width = "wide",
  className,
}: {
  children: React.ReactNode
  showAdminToggle?: boolean
  /** `wide` para listados y tableros, `narrow` para lectura y formularios. */
  width?: "wide" | "narrow"
  className?: string
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <Navbar showAdminToggle={showAdminToggle} />
      <main
        className={cn(
          "mx-auto w-full flex-1 px-4 py-8 sm:px-6 lg:px-8",
          width === "wide" ? "max-w-7xl" : "max-w-4xl",
          className,
        )}
      >
        {children}
      </main>
      <Footer />
    </div>
  )
}
