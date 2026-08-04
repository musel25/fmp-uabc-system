import type React from "react"
import { cn } from "@/lib/utils"

type StatTone = "neutral" | "approved" | "pending" | "rejected"

const TONE_RULE: Record<StatTone, string> = {
  neutral: "bg-[var(--line-strong)]",
  approved: "bg-[var(--state-approved)]",
  pending: "bg-[var(--state-pending)]",
  rejected: "bg-[var(--state-rejected)]",
}

/**
 * Cifra sola con su etiqueta. El número va en la voz de dato (mono, cifras
 * tabulares); el color vive en el filete lateral, nunca en el texto, para que
 * la cifra se lea igual de bien en cualquier estado.
 */
export function StatCard({
  label,
  value,
  caption,
  tone = "neutral",
  icon,
  className,
}: {
  label: string
  value: React.ReactNode
  caption?: string
  tone?: StatTone
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("card-uabc relative overflow-hidden p-4", className)}>
      <span
        className={cn("absolute inset-y-0 left-0 w-1", TONE_RULE[tone])}
        aria-hidden="true"
      />
      <div className="pl-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="eyebrow">{label}</p>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
        <p className="font-data mt-2 text-3xl font-semibold leading-none text-ink">{value}</p>
        {caption && <p className="mt-1.5 text-xs text-muted-foreground">{caption}</p>}
      </div>
    </div>
  )
}
