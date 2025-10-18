import React, { useState, useRef } from 'react'

interface MediaProps {
  src: string
  type: 'image' | 'video' | 'audio' | 'iframe' | 'embed'
  alt?: string
  title?: string
  width?: string | number
  height?: string | number
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  objectPosition?: string
  controls?: boolean
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  preload?: 'none' | 'metadata' | 'auto'
  allowFullScreen?: boolean
  sandbox?: string
  loading?: 'lazy' | 'eager'
  placeholder?: string
  fallback?: string
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  onLoad?: () => void
  onError?: () => void
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const Media: React.FC<MediaProps> = ({
  src,
  type,
  alt,
  title,
  width,
  height,
  objectFit = 'cover',
  objectPosition = 'center',
  controls = true,
  autoplay = false,
  loop = false,
  muted = false,
  preload = 'metadata',
  allowFullScreen = false,
  sandbox,
  loading = 'lazy',
  placeholder,
  fallback,
  className = '',
  style = {},
  onClick,
  onLoad,
  onError,
  onPlay,
  onPause,
  onEnded,
  onMouseEnter,
  onMouseLeave
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement | HTMLAudioElement | HTMLIFrameElement>(null)

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
    if (onLoad) onLoad()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    if (fallback) {
      // Handle fallback for different media types
    }
    if (onError) onError()
  }

  const handlePlay = () => {
    if (onPlay) onPlay()
  }

  const handlePause = () => {
    if (onPause) onPause()
  }

  const handleEnded = () => {
    if (onEnded) onEnded()
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

  const mediaStyle: React.CSSProperties = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    objectPosition
  }

  const mediaClasses = [
    'transition-opacity duration-300',
    getObjectFitClass(),
    isLoading ? 'opacity-0' : 'opacity-100',
    className
  ].filter(Boolean).join(' ')

  const renderMedia = () => {
    switch (type) {
      case 'image':
        return (
          <img
            ref={mediaRef as React.RefObject<HTMLImageElement>}
            src={src}
            alt={alt || ''}
            loading={loading}
            className={mediaClasses}
            style={mediaStyle}
            onClick={onClick}
            onLoad={handleLoad}
            onError={handleError}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          />
        )
      
      case 'video':
        return (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={src}
            poster={placeholder}
            controls={controls}
            autoPlay={autoplay}
            loop={loop}
            muted={muted}
            preload={preload}
            className={mediaClasses}
            style={mediaStyle}
            onClick={onClick}
            onLoadedData={handleLoad}
            onError={handleError}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          />
        )
      
      case 'audio':
        return (
          <audio
            ref={mediaRef as React.RefObject<HTMLAudioElement>}
            src={src}
            controls={controls}
            autoPlay={autoplay}
            loop={loop}
            muted={muted}
            preload={preload}
            className={mediaClasses}
            style={mediaStyle}
            onClick={onClick}
            onLoadedData={handleLoad}
            onError={handleError}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          />
        )
      
      case 'iframe':
      case 'embed':
        return (
          <iframe
            ref={mediaRef as React.RefObject<HTMLIFrameElement>}
            src={src}
            title={title}
            width={width}
            height={height}
            allowFullScreen={allowFullScreen}
            sandbox={sandbox}
            loading={loading}
            className={mediaClasses}
            style={mediaStyle}
            onClick={onClick}
            onLoad={handleLoad}
            onError={handleError}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <div className="relative inline-block">
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={mediaStyle}
        >
          <span className="text-gray-400 text-sm">Loading {type}...</span>
        </div>
      )}
      
      {renderMedia()}
      
      {hasError && (
        <div
          className="absolute inset-0 bg-gray-100 flex items-center justify-center"
          style={mediaStyle}
        >
          <span className="text-gray-400 text-sm">{type} not found</span>
        </div>
      )}
    </div>
  )
}

// Responsive Media component
interface ResponsiveMediaProps {
  src: string
  type: 'image' | 'video' | 'audio' | 'iframe' | 'embed'
  alt?: string
  title?: string
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  objectPosition?: string
  controls?: boolean
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  preload?: 'none' | 'metadata' | 'auto'
  allowFullScreen?: boolean
  sandbox?: string
  loading?: 'lazy' | 'eager'
  placeholder?: string
  fallback?: string
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  onLoad?: () => void
  onError?: () => void
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const ResponsiveMedia: React.FC<ResponsiveMediaProps> = ({
  src,
  type,
  alt,
  title,
  objectFit = 'cover',
  objectPosition = 'center',
  controls = true,
  autoplay = false,
  loop = false,
  muted = false,
  preload = 'metadata',
  allowFullScreen = false,
  sandbox,
  loading = 'lazy',
  placeholder,
  fallback,
  className = '',
  style = {},
  onClick,
  onLoad,
  onError,
  onPlay,
  onPause,
  onEnded,
  onMouseEnter,
  onMouseLeave
}) => {
  return (
    <Media
      src={src}
      type={type}
      alt={alt}
      title={title}
      width="100%"
      height="auto"
      objectFit={objectFit}
      objectPosition={objectPosition}
      controls={controls}
      autoplay={autoplay}
      loop={loop}
      muted={muted}
      preload={preload}
      allowFullScreen={allowFullScreen}
      sandbox={sandbox}
      loading={loading}
      placeholder={placeholder}
      fallback={fallback}
      className={className}
      style={style}
      onClick={onClick}
      onLoad={onLoad}
      onError={onError}
      onPlay={onPlay}
      onPause={onPause}
      onEnded={onEnded}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  )
}

// Media Gallery component
interface MediaGalleryProps {
  items: Array<{
    src: string
    type: 'image' | 'video' | 'audio' | 'iframe' | 'embed'
    alt?: string
    title?: string
    caption?: string
  }>
  width?: string | number
  height?: string | number
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  objectPosition?: string
  controls?: boolean
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  preload?: 'none' | 'metadata' | 'auto'
  allowFullScreen?: boolean
  sandbox?: string
  loading?: 'lazy' | 'eager'
  placeholder?: string
  fallback?: string
  className?: string
  style?: React.CSSProperties
  onClick?: (item: any, index: number) => void
  onLoad?: (item: any, index: number) => void
  onError?: (item: any, index: number) => void
  onPlay?: (item: any, index: number) => void
  onPause?: (item: any, index: number) => void
  onEnded?: (item: any, index: number) => void
  onMouseEnter?: (item: any, index: number) => void
  onMouseLeave?: (item: any, index: number) => void
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  items,
  width,
  height,
  objectFit = 'cover',
  objectPosition = 'center',
  controls = true,
  autoplay = false,
  loop = false,
  muted = false,
  preload = 'metadata',
  allowFullScreen = false,
  sandbox,
  loading = 'lazy',
  placeholder,
  fallback,
  className = '',
  style = {},
  onClick,
  onLoad,
  onError,
  onPlay,
  onPause,
  onEnded,
  onMouseEnter,
  onMouseLeave
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`} style={style}>
      {items.map((item, index) => (
        <div key={index} className="relative group">
          <Media
            src={item.src}
            type={item.type}
            alt={item.alt}
            title={item.title}
            width={width}
            height={height}
            objectFit={objectFit}
            objectPosition={objectPosition}
            controls={controls}
            autoplay={autoplay}
            loop={loop}
            muted={muted}
            preload={preload}
            allowFullScreen={allowFullScreen}
            sandbox={sandbox}
            loading={loading}
            placeholder={placeholder}
            fallback={fallback}
            onClick={() => onClick?.(item, index)}
            onLoad={() => onLoad?.(item, index)}
            onError={() => onError?.(item, index)}
            onPlay={() => onPlay?.(item, index)}
            onPause={() => onPause?.(item, index)}
            onEnded={() => onEnded?.(item, index)}
            onMouseEnter={() => onMouseEnter?.(item, index)}
            onMouseLeave={() => onMouseLeave?.(item, index)}
          />
          
          {item.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {item.caption}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}