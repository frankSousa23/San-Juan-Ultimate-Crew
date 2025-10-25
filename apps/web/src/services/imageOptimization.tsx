import React, { useState, useEffect, useCallback } from 'react'

// Servicio de optimización de imágenes
export interface ImageOptimizationOptions {
  quality?: number // 0-100
  format?: 'webp' | 'jpeg' | 'png' | 'avif'
  width?: number
  height?: number
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  position?: 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top' | 'center'
  background?: string
  blur?: number
  sharpen?: number
  grayscale?: boolean
  sepia?: boolean
  tint?: string
}

export interface OptimizedImage {
  src: string
  srcSet: string
  sizes: string
  alt: string
  width: number
  height: number
  format: string
  quality: number
}

// Clase para optimización de imágenes
export class ImageOptimizationService {
  private baseUrl: string
  private defaultOptions: Required<ImageOptimizationOptions>

  constructor(baseUrl: string = '', defaultOptions: Partial<ImageOptimizationOptions> = {}) {
    this.baseUrl = baseUrl
    this.defaultOptions = {
      quality: 80,
      format: 'webp',
      width: 800,
      height: 600,
      fit: 'cover',
      position: 'center',
      background: '#ffffff',
      blur: 0,
      sharpen: 0,
      grayscale: false,
      sepia: false,
      tint: '',
      ...defaultOptions,
    }
  }

  // Generar URL optimizada para una imagen
  generateOptimizedUrl(
    imageUrl: string,
    options: Partial<ImageOptimizationOptions> = {}
  ): string {
    const opts = { ...this.defaultOptions, ...options }
    const params = new URLSearchParams()

    // Parámetros básicos
    if (opts.quality !== 80) params.set('q', opts.quality.toString())
    if (opts.format !== 'webp') params.set('f', opts.format)
    if (opts.width !== 800) params.set('w', opts.width.toString())
    if (opts.height !== 600) params.set('h', opts.height.toString())
    if (opts.fit !== 'cover') params.set('fit', opts.fit)
    if (opts.position !== 'center') params.set('pos', opts.position)
    if (opts.background !== '#ffffff') params.set('bg', opts.background)

    // Efectos
    if (opts.blur > 0) params.set('blur', opts.blur.toString())
    if (opts.sharpen > 0) params.set('sharpen', opts.sharpen.toString())
    if (opts.grayscale) params.set('grayscale', '1')
    if (opts.sepia) params.set('sepia', '1')
    if (opts.tint) params.set('tint', opts.tint)

    const queryString = params.toString()
    const separator = imageUrl.includes('?') ? '&' : '?'
    
    return `${this.baseUrl}${imageUrl}${queryString ? `${separator}${queryString}` : ''}`
  }

  // Generar srcSet para imágenes responsivas
  generateSrcSet(
    imageUrl: string,
    sizes: number[],
    options: Partial<ImageOptimizationOptions> = {}
  ): string {
    return sizes
      .map(size => {
        const url = this.generateOptimizedUrl(imageUrl, { ...options, width: size })
        return `${url} ${size}w`
      })
      .join(', ')
  }

  // Generar atributo sizes para imágenes responsivas
  generateSizes(breakpoints: Array<{ minWidth: number; size: string }>): string {
    return breakpoints
      .map(({ minWidth, size }) => `(min-width: ${minWidth}px) ${size}`)
      .join(', ')
  }

  // Crear imagen optimizada completa
  createOptimizedImage(
    imageUrl: string,
    alt: string,
    options: Partial<ImageOptimizationOptions> = {}
  ): OptimizedImage {
    const opts = { ...this.defaultOptions, ...options }
    const src = this.generateOptimizedUrl(imageUrl, opts)
    
    // Generar srcSet para diferentes tamaños
    const sizes = [320, 640, 800, 1024, 1200, 1600]
    const srcSet = this.generateSrcSet(imageUrl, sizes, opts)
    
    // Generar sizes responsivos
    const breakpoints = [
      { minWidth: 320, size: '100vw' },
      { minWidth: 640, size: '50vw' },
      { minWidth: 1024, size: '33vw' },
      { minWidth: 1200, size: '25vw' },
    ]
    const sizesAttr = this.generateSizes(breakpoints)

    return {
      src,
      srcSet,
      sizes: sizesAttr,
      alt,
      width: opts.width,
      height: opts.height,
      format: opts.format,
      quality: opts.quality,
    }
  }

  // Optimizar imagen para avatar
  createAvatarImage(imageUrl: string, size: number = 100): OptimizedImage {
    return this.createOptimizedImage(imageUrl, 'Avatar', {
      width: size,
      height: size,
      fit: 'cover',
      format: 'webp',
      quality: 90,
    })
  }

  // Optimizar imagen para thumbnail
  createThumbnailImage(imageUrl: string, width: number = 200, height: number = 150): OptimizedImage {
    return this.createOptimizedImage(imageUrl, 'Thumbnail', {
      width,
      height,
      fit: 'cover',
      format: 'webp',
      quality: 85,
    })
  }

  // Optimizar imagen para hero/banner
  createHeroImage(imageUrl: string, width: number = 1200, height: number = 600): OptimizedImage {
    return this.createOptimizedImage(imageUrl, 'Hero image', {
      width,
      height,
      fit: 'cover',
      format: 'webp',
      quality: 85,
    })
  }

  // Optimizar imagen para galería
  createGalleryImage(imageUrl: string, size: number = 400): OptimizedImage {
    return this.createOptimizedImage(imageUrl, 'Gallery image', {
      width: size,
      height: size,
      fit: 'cover',
      format: 'webp',
      quality: 80,
    })
  }

  // Aplicar efectos a imagen
  applyEffects(
    imageUrl: string,
    effects: {
      blur?: number
      sharpen?: number
      grayscale?: boolean
      sepia?: boolean
      tint?: string
    }
  ): string {
    return this.generateOptimizedUrl(imageUrl, effects)
  }

  // Crear placeholder para imagen
  createPlaceholder(width: number, height: number, text?: string): string {
    const params = new URLSearchParams({
      w: width.toString(),
      h: height.toString(),
      bg: 'f3f4f6',
      txt: text || `${width}x${height}`,
      txtclr: '9ca3af',
      txtsize: '14',
    })

    return `${this.baseUrl}/placeholder?${params.toString()}`
  }

  // Detectar si el navegador soporta WebP
  static supportsWebP(): boolean {
    if (typeof window === 'undefined') return false
    
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
  }

  // Detectar si el navegador soporta AVIF
  static supportsAVIF(): boolean {
    if (typeof window === 'undefined') return false
    
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0
  }

  // Obtener el mejor formato soportado
  static getBestFormat(): 'avif' | 'webp' | 'jpeg' {
    if (this.supportsAVIF()) return 'avif'
    if (this.supportsWebP()) return 'webp'
    return 'jpeg'
  }
}

// Instancia global del servicio de optimización
export const imageOptimization = new ImageOptimizationService()

// Hook para usar optimización de imágenes
export function useImageOptimization() {
  const [supportsWebP, setSupportsWebP] = useState(false)
  const [supportsAVIF, setSupportsAVIF] = useState(false)
  const [bestFormat, setBestFormat] = useState<'avif' | 'webp' | 'jpeg'>('jpeg')

  useEffect(() => {
    setSupportsWebP(ImageOptimizationService.supportsWebP())
    setSupportsAVIF(ImageOptimizationService.supportsAVIF())
    setBestFormat(ImageOptimizationService.getBestFormat())
  }, [])

  const optimizeImage = useCallback((
    imageUrl: string,
    alt: string,
    options: Partial<ImageOptimizationOptions> = {}
  ) => {
    return imageOptimization.createOptimizedImage(imageUrl, alt, {
      ...options,
      format: bestFormat,
    })
  }, [bestFormat])

  const createAvatar = useCallback((imageUrl: string, size: number = 100) => {
    return imageOptimization.createAvatarImage(imageUrl, size)
  }, [])

  const createThumbnail = useCallback((imageUrl: string, width: number = 200, height: number = 150) => {
    return imageOptimization.createThumbnailImage(imageUrl, width, height)
  }, [])

  const createHero = useCallback((imageUrl: string, width: number = 1200, height: number = 600) => {
    return imageOptimization.createHeroImage(imageUrl, width, height)
  }, [])

  const createGallery = useCallback((imageUrl: string, size: number = 400) => {
    return imageOptimization.createGalleryImage(imageUrl, size)
  }, [])

  const createPlaceholder = useCallback((width: number, height: number, text?: string) => {
    return imageOptimization.createPlaceholder(width, height, text)
  }, [])

  return {
    supportsWebP,
    supportsAVIF,
    bestFormat,
    optimizeImage,
    createAvatar,
    createThumbnail,
    createHero,
    createGallery,
    createPlaceholder,
  }
}

// Componente de imagen optimizada
interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  style?: React.CSSProperties
  options?: Partial<ImageOptimizationOptions>
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  style = {},
  options = {},
  placeholder,
  onLoad,
  onError,
}) => {
  const { optimizeImage, createPlaceholder } = useImageOptimization()
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const optimizedImage = useMemo(() => {
    return optimizeImage(src, alt, {
      width,
      height,
      ...options,
    })
  }, [src, alt, width, height, options, optimizeImage])

  const placeholderSrc = useMemo(() => {
    if (placeholder) return placeholder
    if (width && height) return createPlaceholder(width, height)
    return createPlaceholder(400, 300)
  }, [placeholder, width, height, createPlaceholder])

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    setHasError(true)
    onError?.()
  }, [onError])

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {!isLoaded && !hasError && (
        <img
          src={placeholderSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      
      <img
        src={optimizedImage.src}
        srcSet={optimizedImage.srcSet}
        sizes={optimizedImage.sizes}
        alt={optimizedImage.alt}
        width={optimizedImage.width}
        height={optimizedImage.height}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-sm">Error al cargar imagen</div>
        </div>
      )}
    </div>
  )
}
