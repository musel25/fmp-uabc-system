import { cn } from "@/lib/utils"

/**
 * Marca de la aplicación, en corto: el cuadro lleva las siglas de la facultad
 * y el logotipo la universidad. La cabecera institucional, arriba, ya dice el
 * nombre completo — aquí sobra repetirlo.
 */
export function Logo({
  className,
  tone = "onDark",
}: {
  className?: string
  tone?: "onDark" | "onLight"
}) {
  const onDark = tone === "onDark"

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "font-data flex h-7 w-7 items-center justify-center rounded-[5px] text-[0.625rem] font-semibold tracking-tight",
          onDark
            ? "bg-white text-[var(--uabc-green-deep)]"
            : "bg-[var(--uabc-green)] text-white",
        )}
        aria-hidden="true"
      >
        FMP
      </span>
      <span
        className={cn(
          "font-display text-lg font-semibold tracking-tight",
          onDark ? "text-white" : "text-ink",
        )}
      >
        UABC
      </span>
      <span className="sr-only">Facultad de Medicina y Psicología — UABC</span>
    </span>
  )
}
