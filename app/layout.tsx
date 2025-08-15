import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Registro y Constancias FMP-UABC",
  description: "Sistema de registro y constancias para la Facultad de Medicina y Psicología - UABC",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es-MX" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen bg-background font-sans text-foreground">{children}</body>
    </html>
  )
}
