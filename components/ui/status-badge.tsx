import { Check, Clock, X, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

type EventStatus = "en_revision" | "aprobado" | "rechazado"
type CertificateStatus = "sin_solicitar" | "solicitadas" | "emitidas"

interface StatusBadgeProps {
  status: EventStatus | CertificateStatus
  className?: string
}

const statusConfig = {
  en_revision: { label: "En revisión", icon: Clock, className: "chip-revision" },
  aprobado: { label: "Aprobado", icon: Check, className: "chip-aprobado" },
  rechazado: { label: "Rechazado", icon: X, className: "chip-rechazado" },
  sin_solicitar: { label: "Sin solicitar", icon: FileText, className: "chip-borrador" },
  solicitadas: { label: "Solicitadas", icon: Clock, className: "chip-revision" },
  emitidas: { label: "Emitidas", icon: Check, className: "chip-aprobado" },
} as const

/**
 * El estado se comunica con icono + texto, nunca sólo con color.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  if (!config) return null
  const Icon = config.icon

  return (
    <span className={cn("chip", config.className, className)}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      {config.label}
    </span>
  )
}
