import React, { useState, useRef } from 'react'

interface ImageProps {
  src: string
  alt: string
  width?: string | number
  height?: string | number
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  objectPosition?: string
  loading?: 'lazy' | 'eager'
  placeholder?: string
  fallback?: string
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  onLoad?: () => void
  onError?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const Image: React.FC<ImageProps> = ({
  src,
  alt,
  width,
  height,
  objectFit = 'cover',
  objectPosition = 'center',
  loading = 'lazy',
  placeholder,
  fallback,
  className = '',
  style = {},
  onClick,
  onLoad,
  onError,
  onMouseEnter,
  onMouseLeave
}) => {
  const [imageSrc, setImageSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
    if (onLoad) onLoad()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    if (fallback) {
      setImageSrc(fallback)
    }
    if (onError) onError()
  }

  const getObjectFitClass = () => {
    switch (objectFit) {
      case 'contain':
        return 'object-contain'
      case 'cover':
        return 'object-cover'
      case 'fill':
        return 'object-fill'
      case 'none':
        return 'object-none'
      case 'scale-down':
        return 'object-scale-down'
      default:
        return 'object-cover'
    }
  }

  const imageStyle: React.CSSProperties = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    objectPosition
  }

  const imageClasses = [
    'transition-opacity duration-300',
    getObjectFitClass(),
    isLoading ? 'opacity-0' : 'opacity-100',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className="relative inline-block">
      {isLoading && placeholder && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={imageStyle}
        >
          <span className="text-gray-400 text-sm">Loading...</span>
        </div>
      )}
      
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        loading={loading}
        className={imageClasses}
        style={imageStyle}
        onClick={onClick}
        onLoad={handleLoad}
        onError={handleError}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
      
      {hasError && !fallback && (
        <div
          className="absolute inset-0 bg-gray-100 flex items-center justify-center"
          style={imageStyle}
        >
          <span className="text-gray-400 text-sm">Image not found</span>
        </div>
      )}
    </div>
  )
}

// Avatar Image component
interface AvatarImageProps {
  src: string
  alt: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  fallback?: string
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  onLoad?: () => void
  onError?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const AvatarImage: React.FC<AvatarImageProps> = ({
  src,
  alt,
  size = 'md',
  fallback,
  className = '',
  style = {},
  onClick,
  onLoad,
  onError,
  onMouseEnter,
  onMouseLeave
}) => {
  const getSizeClass = () => {
    switch (size) {
      case 'xs':
        return 'w-6 h-6'
      case 'sm':
        return 'w-8 h-8'
      case 'md':
        return 'w-10 h-10'
      case 'lg':
        return 'w-12 h-12'
      case 'xl':
        return 'w-16 h-16'
      case '2xl':
        return 'w-20 h-20'
      case '3xl':
        return 'w-24 h-24'
      default:
        return 'w-10 h-10'
    }
  }

  const avatarClasses = [
    'rounded-full',
    getSizeClass(),
    className
  ].filter(Boolean).join(' ')

  return (
    <Image
      src={src}
      alt={alt}
      objectFit="cover"
      fallback={fallback}
      className={avatarClasses}
      style={style}
      onClick={onClick}
      onLoad={onLoad}
      onError={onError}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  )
}

// Responsive Image component
interface ResponsiveImageProps {
  src: string
  alt: string
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  objectPosition?: string
  loading?: 'lazy' | 'eager'
  placeholder?: string
  fallback?: string
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  onLoad?: () => void
  onError?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  objectFit = 'cover',
  objectPosition = 'center',
  loading = 'lazy',
  placeholder,
  fallback,
  className = '',
  style = {},
  onClick,
  onLoad,
  onError,
  onMouseEnter,
  onMouseLeave
}) => {
  return (
    <Image
      src={src}
      alt={alt}
      width="100%"
      height="auto"
      objectFit={objectFit}
      objectPosition={objectPosition}
      loading={loading}
      placeholder={placeholder}
      fallback={fallback}
      className={className}
      style={style}
      onClick={onClick}
      onLoad={onLoad}
      onError={onError}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  )
}

// Lazy Image component
interface LazyImageProps {
  src: string
  alt: string
  width?: string | number
  height?: string | number
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  objectPosition?: string
  placeholder?: string
  fallback?: string
  threshold?: number
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  onLoad?: () => void
  onError?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  objectFit = 'cover',
  objectPosition = 'center',
  placeholder,
  fallback,
  threshold = 0.1,
  className = '',
  style = {},
  onClick,
  onLoad,
  onError,
  onMouseEnter,
  onMouseLeave
}) => {
  const [isInView, setIsInView] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  const handleLoad = () => {
    setIsLoaded(true)
    if (onLoad) onLoad()
  }

  const handleError = () => {
    setIsLoaded(true)
    if (onError) onError()
  }

  const getObjectFitClass = () => {
    switch (objectFit) {
      case 'contain':
        return 'object-contain'
      case 'cover':
        return 'object-cover'
      case 'fill':
        return 'object-fill'
      case 'none':
        return 'object-none'
      case 'scale-down':
        return 'object-scale-down'
      default:
        return 'object-cover'
    }
  }

  const imageStyle: React.CSSProperties = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    objectPosition
  }

  const imageClasses = [
    'transition-opacity duration-300',
    getObjectFitClass(),
    isLoaded ? 'opacity-100' : 'opacity-0',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className="relative inline-block" ref={imgRef}>
      {!isInView && placeholder && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={imageStyle}
        >
          <span className="text-gray-400 text-sm">Loading...</span>
        </div>
      )}
      
      {isInView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={imageClasses}
          style={imageStyle}
          onClick={onClick}
          onLoad={handleLoad}
          onError={handleError}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        />
      )}
      
      {isInView && !isLoaded && (
        <div
          className="absolute inset-0 bg-gray-100 flex items-center justify-center"
          style={imageStyle}
        >
          <span className="text-gray-400 text-sm">Loading...</span>
        </div>
      )}
    </div>
  )
}

// Gallery Image component
interface GalleryImageProps {
  src: string
  alt: string
  thumbnail?: string
  caption?: string
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  objectPosition?: string
  loading?: 'lazy' | 'eager'
  placeholder?: string
  fallback?: string
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  onLoad?: () => void
  onError?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const GalleryImage: React.FC<GalleryImageProps> = ({
  src,
  alt,
  thumbnail,
  caption,
  objectFit = 'cover',
  objectPosition = 'center',
  loading = 'lazy',
  placeholder,
  fallback,
  className = '',
  style = {},
  onClick,
  onLoad,
  onError,
  onMouseEnter,
  onMouseLeave
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(thumbnail || src)

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
    if (onLoad) onLoad()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    if (fallback) {
      setCurrentSrc(fallback)
    }
    if (onError) onError()
  }

  const getObjectFitClass = () => {
    switch (objectFit) {
      case 'contain':
        return 'object-contain'
      case 'cover':
        return 'object-cover'
      case 'fill':
        return 'object-fill'
      case 'none':
        return 'object-none'
      case 'scale-down':
        return 'object-scale-down'
      default:
        return 'object-cover'
    }
  }

  const imageClasses = [
    'transition-opacity duration-300',
    getObjectFitClass(),
    isLoading ? 'opacity-0' : 'opacity-100',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className="relative group">
      <Image
        src={currentSrc}
        alt={alt}
        objectFit={objectFit}
        objectPosition={objectPosition}
        loading={loading}
        placeholder={placeholder}
        fallback={fallback}
        className={imageClasses}
        style={style}
        onClick={onClick}
        onLoad={handleLoad}
        onError={handleError}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
      
      {caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {caption}
        </div>
      )}
    </div>
  )
}
