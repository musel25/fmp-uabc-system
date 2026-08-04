"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatCard } from "@/components/ui/stat-card"
import { EventCard } from "@/components/events/event-card"
import { ProcessRail } from "@/components/workflow/process-guide"
import { CalendarPlus, CalendarX2, Loader2, Search, TriangleAlert } from "lucide-react"
import { getUserEvents } from "@/lib/supabase-database"
import { getAuthUser } from "@/lib/supabase-auth"
import { useToast } from "@/hooks/use-toast"
import { nextStepFor } from "@/lib/workflow"
import type { Event, EventStatus } from "@/lib/types"

type Tab = "todos" | "en_revision" | "aprobado" | "rechazado"

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [activeTab, setActiveTab] = useState<Tab>("todos")
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true

    const loadEvents = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const user = await getAuthUser()
        if (!user) {
          router.push("/login")
          return
        }

        const userEvents = await getUserEvents(user.id)
        if (mounted) setEvents(userEvents)
      } catch (err) {
        console.error("Load events error:", err)
        if (!mounted) return
        setError("No se pudieron cargar tus eventos.")
        toast({
          title: "No se pudieron cargar tus eventos",
          description: "Revisa tu conexión y vuelve a intentarlo.",
          variant: "destructive",
        })
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    loadEvents()
    return () => {
      mounted = false
    }
  }, [router, toast])

  const counts = useMemo(() => {
    const byStatus = (status: EventStatus) => events.filter((e) => e.status === status).length
    return {
      todos: events.length,
      en_revision: byStatus("en_revision"),
      aprobado: byStatus("aprobado"),
      rechazado: byStatus("rechazado"),
    }
  }, [events])

  /** Eventos aprobados que ya terminaron y siguen sin evidencias en plazo. */
  const pendingEvidence = useMemo(
    () =>
      events.filter((e) => {
        const step = nextStepFor(e)
        return step.phaseId === "evidencias"
      }).length,
    [events],
  )

  const filteredEvents = useMemo(() => {
    const term = search.trim().toLowerCase()
    return events
      .filter((e) => (activeTab === "todos" ? true : e.status === activeTab))
      .filter((e) =>
        term
          ? e.name.toLowerCase().includes(term) ||
            e.venue?.toLowerCase().includes(term) ||
            e.program.toLowerCase().includes(term)
          : true,
      )
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
  }, [events, activeTab, search])

  /** Fase del proceso a resaltar en la ruta: la del evento más urgente. */
  const activePhaseId = useMemo(() => {
    if (events.length === 0) return "autorizacion"
    const urgent = events.find((e) => nextStepFor(e).tone === "urgent")
    const target = urgent ?? events.find((e) => e.status === "aprobado") ?? events[0]
    return nextStepFor(target).phaseId
  }, [events])

  return (
    <ProtectedRoute>
      <AppShell showAdminToggle>
        <PageHeader
          eyebrow="Panel del organizador"
          title="Mis eventos"
          description="Registra actividades, sigue su revisión y entrega las evidencias para las constancias."
          actions={
            <Button asChild className="btn-primary">
              <Link href="/events/new">
                <CalendarPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                Registrar evento
              </Link>
            </Button>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Eventos registrados" value={counts.todos} />
          <StatCard
            label="En revisión"
            value={counts.en_revision}
            tone="pending"
            caption="Respuesta en 3 a 5 días hábiles"
          />
          <StatCard label="Aprobados" value={counts.aprobado} tone="approved" />
          <StatCard
            label="Evidencias pendientes"
            value={pendingEvidence}
            tone={pendingEvidence > 0 ? "pending" : "neutral"}
            caption={
              pendingEvidence > 0
                ? "Eventos ya realizados sin evidencias"
                : "Nada pendiente por entregar"
            }
          />
        </div>

        <ProcessRail activePhaseId={activePhaseId} className="mt-6" />

        <div className="mt-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
              <TabsList>
                <TabsTrigger value="todos">Todos ({counts.todos})</TabsTrigger>
                <TabsTrigger value="en_revision">En revisión ({counts.en_revision})</TabsTrigger>
                <TabsTrigger value="aprobado">Aprobados ({counts.aprobado})</TabsTrigger>
                <TabsTrigger value="rechazado">Rechazados ({counts.rechazado})</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative lg:w-72">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, sede o programa"
                aria-label="Buscar en mis eventos"
                className="bg-card pl-9"
              />
            </div>
          </div>

          <div className="mt-5">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
                <p className="mt-3 text-sm text-muted-foreground">Cargando tus eventos…</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--state-rejected-line)] bg-[var(--state-rejected-bg)] py-16 text-center">
                <TriangleAlert
                  className="h-6 w-6 text-[var(--state-rejected)]"
                  aria-hidden="true"
                />
                <h2 className="mt-3 font-display text-base font-semibold text-ink">{error}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  El servidor no respondió. Vuelve a cargar la página para reintentar.
                </p>
                <Button
                  variant="outline"
                  className="mt-4 bg-card"
                  onClick={() => window.location.reload()}
                >
                  Volver a cargar
                </Button>
              </div>
            ) : filteredEvents.length === 0 ? (
              <EmptyState
                tab={activeTab}
                searching={search.trim().length > 0}
                onClearSearch={() => setSearch("")}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

function EmptyState({
  tab,
  searching,
  onClearSearch,
}: {
  tab: Tab
  searching: boolean
  onClearSearch: () => void
}) {
  if (searching) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <Search className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <h2 className="mt-3 font-display text-base font-semibold text-ink">
          Ningún evento coincide con la búsqueda
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Prueba con otro nombre, sede o programa.
        </p>
        <Button variant="outline" className="mt-4 bg-card" onClick={onClearSearch}>
          Limpiar búsqueda
        </Button>
      </div>
    )
  }

  const copy: Record<Tab, { title: string; body: string }> = {
    todos: {
      title: "Aún no registras ningún evento",
      body: "Registra tu primera actividad para comenzar el trámite. Necesitas la autorización de dirección o subdirección y al menos tres semanas de anticipación.",
    },
    en_revision: {
      title: "No tienes eventos en revisión",
      body: "Los eventos que envíes a la coordinación aparecerán aquí mientras se revisan.",
    },
    aprobado: {
      title: "Todavía no tienes eventos aprobados",
      body: "Cuando la coordinación autorice un evento, lo verás aquí junto con los pasos que siguen.",
    },
    rechazado: {
      title: "No tienes eventos rechazados",
      body: "Si un evento requiere cambios, aparecerá aquí con los comentarios de la coordinación.",
    },
  }

  const { title, body } = copy[tab]

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
      <CalendarX2 className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
      <h2 className="mt-3 font-display text-base font-semibold text-ink">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm text-pretty text-muted-foreground">{body}</p>
      {tab === "todos" && (
        <Button asChild className="btn-primary mt-5">
          <Link href="/events/new">
            <CalendarPlus className="mr-2 h-4 w-4" aria-hidden="true" />
            Registrar evento
          </Link>
        </Button>
      )}
    </div>
  )
}
