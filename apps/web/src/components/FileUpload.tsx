import React, { useRef, useState, useCallback } from 'react'

interface FileUploadProps {
  onFileSelect: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  maxFiles?: number
  disabled?: boolean
  className?: string
  label?: string
  error?: string
  required?: boolean
  dragAndDrop?: boolean
  preview?: boolean
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept,
  multiple = false,
  maxSize = 10, // 10MB default
  maxFiles = 1,
  disabled = false,
  className = '',
  label,
  error,
  required = false,
  dragAndDrop = true,
  preview = true
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `El archivo ${file.name} es demasiado grande. Tamaño máximo: ${maxSize}MB`
    }

    // Check file type if accept is specified
    if (accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim())
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      const mimeType = file.type

      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type
        } else if (type.includes('*')) {
          const baseType = type.split('/')[0]
          return mimeType.startsWith(baseType + '/')
        } else {
          return mimeType === type
        }
      })

      if (!isAccepted) {
        return `El archivo ${file.name} no es del tipo permitido. Tipos permitidos: ${accept}`
      }
    }

    return null
  }

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const newErrors: string[] = []
    const validFiles: File[] = []

    // Check max files limit
    if (selectedFiles.length + fileArray.length > maxFiles) {
      newErrors.push(`Solo se pueden seleccionar ${maxFiles} archivo${maxFiles > 1 ? 's' : ''} como máximo`)
    }

    // Validate each file
    fileArray.forEach(file => {
      const error = validateFile(file)
      if (error) {
        newErrors.push(error)
      } else {
        validFiles.push(file)
      }
    })

    setErrors(newErrors)

    if (validFiles.length > 0) {
      const newSelectedFiles = multiple ? [...selectedFiles, ...validFiles] : validFiles
      setSelectedFiles(newSelectedFiles)
      onFileSelect(newSelectedFiles)
    }
  }, [selectedFiles, maxFiles, maxSize, accept, multiple, onFileSelect])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFiles(files)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
  }

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    onFileSelect(newFiles)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return '📄'
      case 'doc':
      case 'docx':
        return '📝'
      case 'xls':
      case 'xlsx':
        return '📊'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️'
      case 'mp4':
      case 'avi':
      case 'mov':
        return '🎥'
      case 'mp3':
      case 'wav':
        return '🎵'
      case 'zip':
      case 'rar':
        return '📦'
      default:
        return '📁'
    }
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {dragAndDrop ? (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50'
              : error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="text-4xl mb-2">📁</div>
          <p className="text-sm text-gray-600 mb-1">
            {isDragOver
              ? 'Suelta los archivos aquí'
              : 'Arrastra archivos aquí o haz clic para seleccionar'}
          </p>
          <p className="text-xs text-gray-500">
            Tamaño máximo: {maxSize}MB
            {accept && ` • Tipos permitidos: ${accept}`}
            {maxFiles > 1 && ` • Máximo ${maxFiles} archivos`}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className={`w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? 'border-red-300' : ''
          }`}
        >
          Seleccionar archivos
        </button>
      )}

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="mt-2 space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* File previews */}
      {preview && selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Archivos seleccionados:</h4>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getFileIcon(file)}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

// Image Upload component
interface ImageUploadProps {
  onImageSelect: (files: File[]) => void
  multiple?: boolean
  maxSize?: number
  maxFiles?: number
  disabled?: boolean
  className?: string
  label?: string
  error?: string
  required?: boolean
  preview?: boolean
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  multiple = false,
  maxSize = 5, // 5MB default for images
  maxFiles = 1,
  disabled = false,
  className = '',
  label,
  error,
  required = false,
  preview = true
}) => {
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateImage = (file: File): string | null => {
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      return `El archivo ${file.name} no es una imagen válida`
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `La imagen ${file.name} es demasiado grande. Tamaño máximo: ${maxSize}MB`
    }

    return null
  }

  const handleImages = (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const newErrors: string[] = []
    const validImages: File[] = []

    // Check max files limit
    if (selectedImages.length + fileArray.length > maxFiles) {
      newErrors.push(`Solo se pueden seleccionar ${maxFiles} imagen${maxFiles > 1 ? 'es' : ''} como máximo`)
    }

    // Validate each image
    fileArray.forEach(file => {
      const error = validateImage(file)
      if (error) {
        newErrors.push(error)
      } else {
        validImages.push(file)
      }
    })

    setErrors(newErrors)

    if (validImages.length > 0) {
      const newSelectedImages = multiple ? [...selectedImages, ...validImages] : validImages
      setSelectedImages(newSelectedImages)
      onImageSelect(newSelectedImages)

      // Generate preview URLs
      const newPreviewUrls = validImages.map(file => URL.createObjectURL(file))
      setPreviewUrls(prev => multiple ? [...prev, ...newPreviewUrls] : newPreviewUrls)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleImages(files)
    }
  }

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const removeImage = (index: number) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(previewUrls[index])
    
    const newImages = selectedImages.filter((_, i) => i !== index)
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index)
    
    setSelectedImages(newImages)
    setPreviewUrls(newPreviewUrls)
    onImageSelect(newImages)
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div
        onClick={handleClick}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="text-4xl mb-2">🖼️</div>
        <p className="text-sm text-gray-600 mb-1">
          Haz clic para seleccionar imágenes
        </p>
        <p className="text-xs text-gray-500">
          Tamaño máximo: {maxSize}MB • Formatos: JPG, PNG, GIF
          {maxFiles > 1 && ` • Máximo ${maxFiles} imágenes`}
        </p>
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="mt-2 space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Image previews */}
      {preview && selectedImages.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Imágenes seleccionadas:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedImages.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={previewUrls[index]}
                  alt={image.name}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
                <p className="text-xs text-gray-500 mt-1 truncate">{image.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
