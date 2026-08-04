import type React from "react"
import type { Metadata } from "next"
import { Inter, Source_Serif_4, IBM_Plex_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

/* Three faces, three jobs:
   serif = the institution, sans = the form, mono = the record. */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
  variable: "--font-source-serif",
})

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
})

export const metadata: Metadata = {
  title: "Registro y Constancias FMP-UABC",
  description:
    "Sistema de registro de eventos y solicitud de constancias de la Facultad de Medicina y Psicología — UABC",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es-MX"
      className={`${inter.variable} ${sourceSerif.variable} ${plexMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
