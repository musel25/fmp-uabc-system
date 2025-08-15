"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, FileText, X, Plus, Trash2, Users, MessageSquare } from "lucide-react"
import type { Event } from "@/lib/types"

const certificateRequestSchema = z.object({
  attendanceList: z.any().optional(),
  photos: z.array(z.any()).optional(),
  summary: z.string().min(1, "La reseña es requerida").max(250, "Máximo 250 palabras"),
  speakers: z.array(
    z.object({
      name: z.string().min(1, "Nombre requerido"),
      role: z.string().min(1, "Rol requerido"),
    }),
  ),
  committee: z.array(
    z.object({
      name: z.string().min(1, "Nombre requerido"),
      role: z.string().min(1, "Rol requerido"),
    }),
  ),
})

type CertificateRequestData = z.infer<typeof certificateRequestSchema>

interface CertificateRequestDialogProps {
  event: Event | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CertificateRequestData) => void
}

export function CertificateRequestDialog({ event, isOpen, onClose, onSubmit }: CertificateRequestDialogProps) {
  const [attendanceFile, setAttendanceFile] = useState<File | null>(null)
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CertificateRequestData>({
    resolver: zodResolver(certificateRequestSchema),
    defaultValues: {
      summary: "",
      speakers: [{ name: "", role: "Ponente" }],
      committee: [{ name: "", role: "Coordinador" }],
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form

  const watchSummary = watch("summary")
  const watchSpeakers = watch("speakers")
  const watchCommittee = watch("committee")

  if (!event) return null

  const handleAttendanceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("El archivo no puede ser mayor a 10 MB")
        return
      }
      setAttendanceFile(file)
    }
  }

  const handlePhotoFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`El archivo ${file.name} es muy grande (máximo 10 MB)`)
        return false
      }
      if (!file.type.startsWith("image/")) {
        alert(`El archivo ${file.name} no es una imagen válida`)
        return false
      }
      return true
    })

    if (photoFiles.length + validFiles.length > 10) {
      alert("Máximo 10 fotos permitidas")
      return
    }

    setPhotoFiles([...photoFiles, ...validFiles])
  }

  const removePhotoFile = (index: number) => {
    setPhotoFiles(photoFiles.filter((_, i) => i !== index))
  }

  const addSpeaker = () => {
    setValue("speakers", [...watchSpeakers, { name: "", role: "Ponente" }])
  }

  const removeSpeaker = (index: number) => {
    setValue(
      "speakers",
      watchSpeakers.filter((_, i) => i !== index),
    )
  }

  const addCommitteeMember = () => {
    setValue("committee", [...watchCommittee, { name: "", role: "Coordinador" }])
  }

  const removeCommitteeMember = (index: number) => {
    setValue(
      "committee",
      watchCommittee.filter((_, i) => i !== index),
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const onFormSubmit = async (data: CertificateRequestData) => {
    if (!attendanceFile) {
      alert("La lista de asistencia es requerida")
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        ...data,
        attendanceList: attendanceFile,
        photos: photoFiles,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar Constancias</DialogTitle>
          <DialogDescription>
            Completa la información y sube los archivos necesarios para solicitar las constancias del evento
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Attendance List Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Lista de Asistencia *
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Sube la lista oficial de asistentes al evento (PDF, Excel, Word - máximo 10 MB)
              </p>

              {!attendanceFile ? (
                <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
                  <CardContent className="flex flex-col items-center justify-center py-6">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">Arrastra tu archivo aquí o</p>
                    <Button variant="outline" asChild>
                      <label htmlFor="attendance-file" className="cursor-pointer">
                        Seleccionar archivo
                        <input
                          id="attendance-file"
                          type="file"
                          accept=".pdf,.xlsx,.xls,.docx,.doc"
                          onChange={handleAttendanceFileUpload}
                          className="hidden"
                        />
                      </label>
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">PDF, Excel, Word - máximo 10 MB</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{attendanceFile.name}</p>
                        <p className="text-sm text-muted-foreground">{formatFileSize(attendanceFile.size)}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setAttendanceFile(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Photos Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Fotografías del Evento (opcional)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Sube fotos representativas del evento (JPG, PNG - máximo 10 fotos, 10 MB cada una)
              </p>

              <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
                <CardContent className="flex flex-col items-center justify-center py-4">
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">Arrastra fotos aquí o</p>
                  <Button variant="outline" asChild>
                    <label htmlFor="photo-files" className="cursor-pointer">
                      Seleccionar fotos
                      <input
                        id="photo-files"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoFilesUpload}
                        className="hidden"
                      />
                    </label>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">JPG, PNG - máximo 10 fotos, 10 MB cada una</p>
                </CardContent>
              </Card>

              {photoFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium">Fotos seleccionadas ({photoFiles.length}/10)</h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    {photoFiles.map((file, index) => (
                      <Card key={index}>
                        <CardContent className="flex items-center justify-between p-3">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removePhotoFile(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Reseña del Evento *
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="summary">Describe cómo se desarrolló el evento</Label>
                <Textarea
                  id="summary"
                  {...register("summary")}
                  placeholder="Describe el desarrollo del evento, participación, logros, etc."
                  className="mt-1"
                  rows={4}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.summary && <p className="text-sm text-destructive">{errors.summary.message}</p>}
                  <p className="text-xs text-muted-foreground ml-auto">{watchSummary?.length || 0}/250 palabras</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Speakers Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Ponentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead className="w-16">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {watchSpeakers.map((speaker, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            {...register(`speakers.${index}.name`)}
                            placeholder="Nombre completo"
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            {...register(`speakers.${index}.role`)}
                            placeholder="Ponente, Moderador, etc."
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          {watchSpeakers.length > 1 && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeSpeaker(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button type="button" variant="outline" onClick={addSpeaker}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar ponente
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Committee Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Comité Organizador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead className="w-16">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {watchCommittee.map((member, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            {...register(`committee.${index}.name`)}
                            placeholder="Nombre completo"
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            {...register(`committee.${index}.role`)}
                            placeholder="Coordinador, Logística, etc."
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          {watchCommittee.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCommitteeMember(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button type="button" variant="outline" onClick={addCommitteeMember}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar miembro
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-800 mb-2">Importante</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• La lista de asistencia es obligatoria para generar las constancias</li>
              <li>• Las fotografías ayudan a documentar la realización del evento</li>
              <li>• Revisa que los nombres estén escritos correctamente</li>
              <li>• El proceso de generación puede tomar de 3 a 5 días hábiles</li>
            </ul>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? "Enviando solicitud..." : "Enviar solicitud"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
