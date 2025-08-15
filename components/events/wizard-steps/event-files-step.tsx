"use client"

import type React from "react"

import { useState } from "react"
import type { UseFormReturn } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileText, X } from "lucide-react"
import type { CreateEventData } from "@/lib/types"

interface EventFilesStepProps {
  form: UseFormReturn<CreateEventData>
}

export function EventFilesStep({ form }: EventFilesStepProps) {
  const [programFile, setProgramFile] = useState<File | null>(null)
  const [cvFiles, setCvFiles] = useState<File[]>([])

  const handleProgramFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("El archivo no puede ser mayor a 10 MB")
        return
      }
      if (
        !["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(
          file.type,
        )
      ) {
        alert("Solo se permiten archivos PDF y DOCX")
        return
      }
      setProgramFile(file)
    }
  }

  const handleCvFilesUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`El archivo ${file.name} es muy grande (máximo 10 MB)`)
        return false
      }
      if (
        !["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(
          file.type,
        )
      ) {
        alert(`El archivo ${file.name} no es válido (solo PDF y DOCX)`)
        return false
      }
      return true
    })

    if (cvFiles.length + validFiles.length > 5) {
      alert("Máximo 5 archivos de CV permitidos")
      return
    }

    setCvFiles([...cvFiles, ...validFiles])
  }

  const removeCvFile = (index: number) => {
    setCvFiles(cvFiles.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
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
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{programFile.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(programFile.size)}</p>
                </div>
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
                    <FileText className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
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
