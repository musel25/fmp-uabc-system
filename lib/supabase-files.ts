import { supabase } from './supabase'
import { getAuthUser } from './supabase-auth'
import type { EventFile } from './types'

// Allowed file types and their MIME types
export const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
} as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const STORAGE_BUCKET = 'event-files'

// File validation
export function validateFile(file: File): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `El archivo es demasiado grande. Máximo permitido: ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }
  }

  // Check file type
  const allowedTypes = Object.keys(ALLOWED_FILE_TYPES)
  if (!allowedTypes.includes(file.type)) {
    const allowedExtensions = Object.values(ALLOWED_FILE_TYPES).flat().join(', ')
    return {
      isValid: false,
      error: `Tipo de archivo no permitido. Tipos permitidos: ${allowedExtensions}`
    }
  }

  return { isValid: true }
}

// Generate unique file path
export function generateFilePath(userId: string, eventId: string, fileName: string, fileType: 'program' | 'cv'): string {
  const timestamp = Date.now()
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${userId}/${eventId}/${fileType}/${timestamp}_${cleanFileName}`
}

// Upload file to Supabase Storage
export async function uploadFile(
  file: File,
  eventId: string,
  fileType: 'program' | 'cv',
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; file?: EventFile; error?: string }> {
  try {
    // Validate file
    const validation = validateFile(file)
    if (!validation.isValid) {
      return { success: false, error: validation.error }
    }

    // Get current user
    const user = await getAuthUser()
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    // Generate file path
    const filePath = generateFilePath(user.id, eventId, file.name, fileType)

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return { success: false, error: 'Error al subir el archivo' }
    }

    // Create EventFile object
    const eventFile: EventFile = {
      id: data.path,
      name: file.name,
      size: file.size,
      type: file.type,
      url: getFileUrl(data.path)
    }

    // Save file reference to database
    const { error: dbError } = await supabase
      .from('event_files')
      .insert({
        event_id: eventId,
        file_name: file.name,
        file_path: data.path,
        file_type: file.type,
        file_size: file.size
      })

    if (dbError) {
      console.error('Database save error:', dbError)
      // Clean up uploaded file if database save fails
      await supabase.storage.from(STORAGE_BUCKET).remove([data.path])
      return { success: false, error: 'Error al guardar la referencia del archivo' }
    }

    return { success: true, file: eventFile }
  } catch (error) {
    console.error('Upload file error:', error)
    return { success: false, error: 'Error inesperado al subir el archivo' }
  }
}

// Get file URL
export function getFileUrl(filePath: string): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath)
  
  return data.publicUrl
}

// Create signed URL for private files
export async function createSignedUrl(filePath: string, expiresIn = 3600): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      console.error('Create signed URL error:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('Create signed URL error:', error)
    return null
  }
}

// Delete file from storage and database
export async function deleteFile(fileId: string, eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get file info from database
    const { data: fileData, error: fetchError } = await supabase
      .from('event_files')
      .select('file_path')
      .eq('id', fileId)
      .eq('event_id', eventId)
      .single()

    if (fetchError || !fileData) {
      return { success: false, error: 'Archivo no encontrado' }
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([fileData.file_path])

    if (storageError) {
      console.error('Storage delete error:', storageError)
      return { success: false, error: 'Error al eliminar el archivo del almacenamiento' }
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('event_files')
      .delete()
      .eq('id', fileId)
      .eq('event_id', eventId)

    if (dbError) {
      console.error('Database delete error:', dbError)
      return { success: false, error: 'Error al eliminar la referencia del archivo' }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete file error:', error)
    return { success: false, error: 'Error inesperado al eliminar el archivo' }
  }
}

// Get files for an event
export async function getEventFiles(eventId: string): Promise<EventFile[]> {
  try {
    const { data, error } = await supabase
      .from('event_files')
      .select('*')
      .eq('event_id', eventId)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Get event files error:', error)
      return []
    }

    return data.map(file => ({
      id: file.id,
      name: file.file_name,
      size: file.file_size,
      type: file.file_type,
      url: getFileUrl(file.file_path)
    }))
  } catch (error) {
    console.error('Get event files error:', error)
    return []
  }
}

// Upload multiple files (for CV files)
export async function uploadMultipleFiles(
  files: File[],
  eventId: string,
  fileType: 'cv',
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<{ success: boolean; files?: EventFile[]; errors?: string[] }> {
  const uploadedFiles: EventFile[] = []
  const errors: string[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    const result = await uploadFile(
      file,
      eventId,
      fileType,
      (progress) => onProgress?.(i, progress)
    )

    if (result.success && result.file) {
      uploadedFiles.push(result.file)
    } else {
      errors.push(`${file.name}: ${result.error}`)
    }
  }

  return {
    success: errors.length === 0,
    files: uploadedFiles,
    errors: errors.length > 0 ? errors : undefined
  }
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Helper function to get file icon based on type
export function getFileIcon(fileType: string): string {
  if (fileType.includes('pdf')) return '📄'
  if (fileType.includes('word') || fileType.includes('document')) return '📝'
  if (fileType.includes('image')) return '🖼️'
  if (fileType.includes('text')) return '📃'
  return '📁'
}