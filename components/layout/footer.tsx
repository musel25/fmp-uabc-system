import { ExternalLink } from "lucide-react"
import { COORDINATION_EMAIL } from "@/components/layout/header"

export function Footer() {
  return (
    <footer className="no-print mt-auto border-t border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="space-y-1">
          <p className="font-medium text-foreground">
            Extensión de la cultura y divulgación de la ciencia
          </p>
          <p className="text-muted-foreground">
            Facultad de Medicina y Psicología · Universidad Autónoma de Baja California
          </p>
        </div>

        <div className="flex flex-col gap-1 text-sm sm:items-end">
          <a
            href={`mailto:${COORDINATION_EMAIL}`}
            className="font-data text-xs text-primary transition-colors hover:text-[var(--green-700)]"
          >
            {COORDINATION_EMAIL}
          </a>
          <p className="text-xs text-muted-foreground">
            Sitio desarrollado por{" "}
            <a
              href="https://musel.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-primary transition-colors hover:text-[var(--green-700)]"
            >
              Müsel Tabares
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
