import { Badge } from "@/components/ui/badge"
import { Check, Clock, X, FileText } from "lucide-react"

type EventStatus = "borrador" | "en_revision" | "aprobado" | "rechazado"
type CertificateStatus = "sin_solicitar" | "solicitadas" | "emitidas"

interface StatusBadgeProps {
  status: EventStatus | CertificateStatus
  className?: string
}

const statusConfig = {
  // Event statuses
  borrador: {
    label: "Borrador",
    icon: FileText,
    className: "chip-borrador",
  },
  en_revision: {
    label: "En revisión",
    icon: Clock,
    className: "chip-revision",
  },
  aprobado: {
    label: "Aprobado",
    icon: Check,
    className: "chip-aprobado",
  },
  rechazado: {
    label: "Rechazado",
    icon: X,
    className: "chip-rechazado",
  },
  // Certificate statuses
  sin_solicitar: {
    label: "Sin solicitar",
    icon: FileText,
    className: "chip-borrador",
  },
  solicitadas: {
    label: "Solicitadas",
    icon: Clock,
    className: "chip-revision",
  },
  emitidas: {
    label: "Emitidas",
    icon: Check,
    className: "chip-aprobado",
  },
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge className={`${config.className} ${className} inline-flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
