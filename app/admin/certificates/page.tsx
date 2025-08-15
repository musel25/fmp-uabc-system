"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/status-badge"
import { AdminCertificateDrawer } from "@/components/admin/admin-certificate-drawer"
import { Award, Eye, Calendar, Loader2 } from "lucide-react"
import { getCertificateRequests, approveCertificateRequest } from "@/lib/supabase-admin"
import { useToast } from "@/hooks/use-toast"
import type { Event } from "@/lib/types"

export default function AdminCertificatesPage() {
  const [certificateRequests, setCertificateRequests] = useState<any[]>([])
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const loadCertificateRequests = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const requests = await getCertificateRequests()
        setCertificateRequests(requests)
      } catch (error) {
        console.error('Load certificate requests error:', error)
        setError('Error al cargar las solicitudes de constancias')
        toast({
          title: "Error",
          description: "No se pudieron cargar las solicitudes de constancias",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadCertificateRequests()
  }, [])

  const handleRequestClick = (request: any) => {
    setSelectedRequest(request)
    setIsDrawerOpen(true)
  }

  const handleApproveCertificates = async (requestId: string) => {
    try {
      await approveCertificateRequest(requestId)

      // Remove the approved request from the list
      setCertificateRequests((prev) => prev.filter((req) => req.id !== requestId))

      toast({
        title: "Constancias aprobadas",
        description: "Las constancias han sido aprobadas y marcadas como emitidas",
      })

      setIsDrawerOpen(false)
      setSelectedRequest(null)
    } catch (error) {
      console.error('Approve certificates error:', error)
      toast({
        title: "Error",
        description: "No se pudieron aprobar las constancias",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }


  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-background">
        <Navbar showAdminToggle />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground-strong">Gestión de Constancias</h1>
            <p className="text-muted-foreground mt-1">Administra las solicitudes de constancias de eventos aprobados</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="card-uabc">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Solicitudes Pendientes</p>
                    <p className="text-2xl font-bold">{isLoading ? '-' : certificateRequests.length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-uabc">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Solicitudes Hoy</p>
                    <p className="text-2xl font-bold">
                      {isLoading ? '-' : certificateRequests.filter(req => 
                        new Date(req.requested_at).toDateString() === new Date().toDateString()
                      ).length}
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-uabc">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Eventos</p>
                    <p className="text-2xl font-bold">
                      {isLoading ? '-' : certificateRequests.length}
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Events Table */}
          <Card className="card-uabc">
            <CardHeader>
              <CardTitle>Solicitudes de Constancias Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Cargando solicitudes...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <Award className="h-12 w-12 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Error al cargar solicitudes</h3>
                  <p className="text-muted-foreground mb-6">{error}</p>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Intentar de nuevo
                  </Button>
                </div>
              ) : certificateRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No hay solicitudes pendientes</h3>
                  <p className="text-muted-foreground">
                    Las solicitudes de constancias aparecerán aquí cuando los organizadores las envíen
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Evento</TableHead>
                        <TableHead>Fecha del Evento</TableHead>
                        <TableHead>Responsable</TableHead>
                        <TableHead>Participantes</TableHead>
                        <TableHead>Fecha Solicitud</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {certificateRequests.map((request) => (
                        <TableRow key={request.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{request.events.name}</p>
                              <p className="text-sm text-muted-foreground">{request.events.program}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{formatDate(request.events.start_date)}</p>
                              <p className="text-muted-foreground">{formatDate(request.events.end_date)}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{request.events.responsible}</p>
                              <p className="text-sm text-muted-foreground">{request.events.profiles?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium">
                              {Array.isArray(request.participant_list) ? request.participant_list.length : 0} participantes
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{formatDate(request.requested_at)}</p>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleRequestClick(request)}>
                              <Eye className="h-4 w-4 mr-1" />
                              Revisar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Certificate Review Drawer */}
        <AdminCertificateDrawer
          request={selectedRequest}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false)
            setSelectedRequest(null)
          }}
          onApproveCertificates={handleApproveCertificates}
        />
      </div>
    </ProtectedRoute>
  )
}
