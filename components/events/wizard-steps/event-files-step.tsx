"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { UseFormReturn } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import type { CreateEventData, EventFile } from "@/lib/types"
import { validateFile, formatFileSize, getFileIcon } from "@/lib/supabase-files"
import { useToast } from "@/hooks/use-toast"

interface EventFilesStepProps {
  form: UseFormReturn<CreateEventData>
  eventId?: string
  onFilesChange?: (files: { programFile: File | null; cvFiles: File[] }) => void
}

export function EventFilesStep({ form, eventId, onFilesChange }: EventFilesStepProps) {
  const [programFile, setProgramFile] = useState<File | null>(null)
  const [cvFiles, setCvFiles] = useState<File[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<EventFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})
  const { toast } = useToast()

  // Notify parent component of file changes
  useEffect(() => {
    onFilesChange?.({ programFile, cvFiles })
  }, [programFile, cvFiles, onFilesChange])

  const handleProgramFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const validation = validateFile(file)
      if (!validation.isValid) {
        toast({
          title: "Error de validación",
          description: validation.error,
          variant: "destructive",
        })
        return
      }
      setProgramFile(file)
      toast({
        title: "Archivo seleccionado",
        description: `${file.name} listo para subir`,
      })
    }
  }

  const handleCvFilesUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles: File[] = []
    const errors: string[] = []

    files.forEach((file) => {
      const validation = validateFile(file)
      if (!validation.isValid) {
        errors.push(`${file.name}: ${validation.error}`)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      toast({
        title: "Algunos archivos no son válidos",
        description: errors.join(", "),
        variant: "destructive",
      })
    }

    if (cvFiles.length + validFiles.length > 5) {
      toast({
        title: "Límite excedido",
        description: "Máximo 5 archivos de CV permitidos",
        variant: "destructive",
      })
      return
    }

    if (validFiles.length > 0) {
      setCvFiles([...cvFiles, ...validFiles])
      toast({
        title: "Archivos seleccionados",
        description: `${validFiles.length} archivo(s) listo(s) para subir`,
      })
    }
  }

  const removeCvFile = (index: number) => {
    setCvFiles(cvFiles.filter((_, i) => i !== index))
  }

  const getUploadStatus = (fileName: string) => {
    const progress = uploadProgress[fileName]
    if (progress === undefined) return null
    if (progress === 100) return 'completed'
    if (progress > 0) return 'uploading'
    return 'pending'
  }

  const renderFileStatus = (fileName: string) => {
    const status = getUploadStatus(fileName)
    const progress = uploadProgress[fileName] || 0

    switch (status) {
      case 'uploading':
        return (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
        )
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Program File Upload */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Programa detallado *</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Sube el programa completo del evento (PDF o DOCX, máximo 10 MB)
        </p>

        {!programFile ? (
          <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">Arrastra tu archivo aquí o</p>
              <Button variant="outline" asChild>
                <label htmlFor="program-file" className="cursor-pointer">
                  Seleccionar archivo
                  <input
                    id="program-file"
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleProgramFileUpload}
                    className="hidden"
                  />
                </label>
              </Button>
              <p className="text-xs text-muted-foreground mt-2">PDF o DOCX, máximo 10 MB</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getFileIcon(programFile.type)}</span>
                <div>
                  <p className="font-medium">{programFile.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(programFile.size)}</p>
                </div>
                {renderFileStatus(programFile.name)}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setProgramFile(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* CV Files Upload */}
      <div>
        <h3 className="text-lg font-semibold mb-2">CVs de ponentes (opcional)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Sube los CVs de los ponentes (PDF o DOCX, máximo 5 archivos, 10 MB cada uno)
        </p>

        <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
          <CardContent className="flex flex-col items-center justify-center py-6">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">Arrastra archivos aquí o</p>
            <Button variant="outline" asChild>
              <label htmlFor="cv-files" className="cursor-pointer">
                Seleccionar archivos
                <input
                  id="cv-files"
                  type="file"
                  accept=".pdf,.docx"
                  multiple
                  onChange={handleCvFilesUpload}
                  className="hidden"
                />
              </label>
            </Button>
            <p className="text-xs text-muted-foreground mt-2">PDF o DOCX, máximo 5 archivos, 10 MB cada uno</p>
          </CardContent>
        </Card>

        {cvFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-medium">Archivos seleccionados ({cvFiles.length}/5)</h4>
            {cvFiles.map((file, index) => (
              <Card key={index}>
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getFileIcon(file.type)}</span>
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    {renderFileStatus(file.name)}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeCvFile(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Ayuda con los archivos</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• El programa detallado debe incluir horarios, temas y ponentes</li>
          <li>• Los CVs de ponentes son opcionales pero recomendados</li>
          <li>• Solo se aceptan archivos PDF y DOCX</li>
          <li>• Tamaño máximo por archivo: 10 MB</li>
        </ul>
      </div>
    </div>
  )
}
