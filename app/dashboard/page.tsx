"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { Plus, Calendar, MapPin, Eye, Edit, Loader2 } from "lucide-react"
import { getUserEvents } from "@/lib/supabase-database"
import { getAuthUser } from "@/lib/supabase-auth"
import { useToast } from "@/hooks/use-toast"
import type { Event, EventStatus } from "@/lib/types"

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [activeTab, setActiveTab] = useState<string>("todos")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get current authenticated user
        const user = await getAuthUser()
        if (!user) {
          router.push("/login")
          return
        }

        // Load user's events from database
        const userEvents = await getUserEvents(user.id)
        setEvents(userEvents)
      } catch (error) {
        console.error('Load events error:', error)
        setError('Error al cargar los eventos')
        toast({
          title: "Error",
          description: "No se pudieron cargar los eventos",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()
  }, [])

  const filterEventsByStatus = (status?: EventStatus) => {
    if (!status) return events
    return events.filter((event) => event.status === status)
  }

  const getFilteredEvents = () => {
    switch (activeTab) {
      case "borrador":
        return filterEventsByStatus("borrador")
      case "revision":
        return filterEventsByStatus("en_revision")
      case "aprobado":
        return filterEventsByStatus("aprobado")
      case "rechazado":
        return filterEventsByStatus("rechazado")
      default:
        return events
    }
  }

  const filteredEvents = getFilteredEvents()

  const EmptyState = ({ status }: { status?: string }) => (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
        <Calendar className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {status ? `No tienes eventos ${status}` : "No tienes eventos"}
      </h3>
      <p className="text-muted-foreground mb-6">
        {!status || status === "todos"
          ? "Crea tu primer evento para comenzar"
          : `Cuando tengas eventos ${status}, aparecerán aquí`}
      </p>
      {(!status || status === "todos") && (
        <Button onClick={() => router.push("/events/new")} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Crear evento
        </Button>
      )}
    </div>
  )

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar showAdminToggle />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground-strong">Mis Eventos</h1>
              <p className="text-muted-foreground mt-1">Gestiona tus eventos y solicitudes de constancias</p>
            </div>
            <Button onClick={() => router.push("/events/new")} className="btn-primary mt-4 sm:mt-0">
              <Plus className="h-4 w-4 mr-2" />
              Crear evento
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="todos">Todos ({events.length})</TabsTrigger>
              <TabsTrigger value="borrador">Borrador ({filterEventsByStatus("borrador").length})</TabsTrigger>
              <TabsTrigger value="revision">En revisión ({filterEventsByStatus("en_revision").length})</TabsTrigger>
              <TabsTrigger value="aprobado">Aprobado ({filterEventsByStatus("aprobado").length})</TabsTrigger>
              <TabsTrigger value="rechazado">Rechazado ({filterEventsByStatus("rechazado").length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Cargando eventos...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="h-12 w-12 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Error al cargar eventos</h3>
                  <p className="text-muted-foreground mb-6">{error}</p>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Intentar de nuevo
                  </Button>
                </div>
              ) : filteredEvents.length === 0 ? (
                <EmptyState status={activeTab === "todos" ? undefined : activeTab} />
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredEvents.map((event) => (
                    <Card key={event.id} className="card-uabc hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg font-semibold line-clamp-2">{event.name}</CardTitle>
                          <StatusBadge status={event.status} />
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(event.startDate).toLocaleDateString("es-MX", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />
                            {event.venue}
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {event.program}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {event.type}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/events/${event.id}`)}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          {(event.status === "borrador" || event.status === "rechazado") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/events/${event.id}/edit`)}
                              className="flex-1"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  )
}
