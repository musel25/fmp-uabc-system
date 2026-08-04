import { Mail } from "lucide-react"
import { cn } from "@/lib/utils"

export const COORDINATION_EMAIL = "yaheko.pardo@uabc.edu.mx"
export const COORDINATION_NAME = "Dra. Naysin Yaheko Pardo Buitimea"
export const COORDINATION_TITLE = "Extensión de la cultura y divulgación de la ciencia"

/**
 * El bloque de identidad institucional: dependencia, coordinación, responsable
 * y contacto. Se usa en la cabecera de la aplicación y en el acceso, para que
 * ambos digan exactamente lo mismo.
 */
export function InstitutionalIdentity({
  className,
  tone = "onDark",
  asHeading = false,
}: {
  className?: string
  tone?: "onDark" | "onLight"
  /**
   * En el acceso este bloque sí es el encabezado de la página. Dentro de la
   * aplicación es un membrete que se repite, y el `h1` le toca al título de
   * cada pantalla.
   */
  asHeading?: boolean
}) {
  const onDark = tone === "onDark"
  const Title = asHeading ? "h1" : "p"

  return (
    <div className={cn("text-center", className)}>
      <p
        className={cn(
          "eyebrow",
          onDark ? "text-[var(--ocre-200)]" : "text-[var(--ocre-600)]",
        )}
      >
        UABC · Facultad de Medicina y Psicología
      </p>

      <Title
        className={cn(
          "mt-2 text-balance font-display text-xl leading-tight font-semibold sm:text-2xl",
          onDark ? "text-white" : "text-ink",
        )}
      >
        {COORDINATION_TITLE}
      </Title>

      <p
        className={cn(
          "mt-2.5 text-sm font-medium",
          onDark ? "text-white/90" : "text-foreground",
        )}
      >
        {COORDINATION_NAME}
      </p>

      <a
        href={`mailto:${COORDINATION_EMAIL}`}
        className={cn(
          "font-data mt-1 inline-flex items-center gap-1.5 rounded-sm text-xs transition-colors",
          onDark
            ? "text-[var(--ocre-200)] hover:text-white"
            : "text-[var(--ocre-600)] hover:text-[var(--green-700)]",
        )}
      >
        <Mail className="h-3 w-3" aria-hidden="true" />
        {COORDINATION_EMAIL}
      </a>
    </div>
  )
}

export function Header() {
  return (
    <header className="bg-[var(--uabc-green-deep)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <InstitutionalIdentity />
      </div>
      {/* Filete institucional: ocre y verde claro sobre la línea de la página. */}
      <div className="rule-uabc h-[3px]" aria-hidden="true" />
    </header>
  )
}
