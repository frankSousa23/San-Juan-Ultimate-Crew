import React, { useState, useRef, useEffect, ReactNode } from 'react'
import { useIntersectionObserver } from '../hooks/useOptimization'
import { LoadingState } from './LoadingState'

interface LazyLoadProps {
  children: ReactNode
  fallback?: ReactNode
  threshold?: number
  rootMargin?: string
  className?: string
  style?: React.CSSProperties
}

export const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  fallback = <LoadingState />,
  threshold = 0.1,
  rootMargin = '50px',
  className = '',
  style = {},
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  const { isIntersecting, hasIntersected } = useIntersectionObserver(elementRef, {
    threshold,
    rootMargin,
  })

  useEffect(() => {
    if (isIntersecting && !hasIntersected) {
      setIsLoaded(true)
    }
  }, [isIntersecting, hasIntersected])

  return (
    <div
      ref={elementRef}
      className={className}
      style={style}
    >
      {isLoaded ? children : fallback}
    </div>
  )
}

// Lazy Image Component
interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  style?: React.CSSProperties
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
  threshold?: number
  rootMargin?: string
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  style = {},
  placeholder,
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '50px',
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const { isIntersecting } = useIntersectionObserver(imgRef, {
    threshold,
    rootMargin,
  })

  useEffect(() => {
    if (isIntersecting) {
      setIsInView(true)
    }
  }, [isIntersecting])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  const imageStyle: React.CSSProperties = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={imageStyle}
    >
      {!isInView ? (
        <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder ? (
            <img
              src={placeholder}
              alt=""
              className="w-full h-full object-cover opacity-50"
            />
          ) : (
            <div className="text-gray-400 text-sm">Cargando...</div>
          )}
        </div>
      ) : (
        <>
          {!isLoaded && !hasError && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              {placeholder ? (
                <img
                  src={placeholder}
                  alt=""
                  className="w-full h-full object-cover opacity-50"
                />
              ) : (
                <div className="text-gray-400 text-sm">Cargando...</div>
              )}
            </div>
          )}
          
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
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
        </>
      )}
    </div>
  )
}

// Lazy Component Wrapper
interface LazyComponentProps {
  component: React.ComponentType<any>
  props?: Record<string, any>
  fallback?: ReactNode
  threshold?: number
  rootMargin?: string
  className?: string
  style?: React.CSSProperties
}

export const LazyComponent: React.FC<LazyComponentProps> = ({
  component: Component,
  props = {},
  fallback = <LoadingState />,
  threshold = 0.1,
  rootMargin = '50px',
  className = '',
  style = {},
}) => {
  return (
    <LazyLoad
      fallback={fallback}
      threshold={threshold}
      rootMargin={rootMargin}
      className={className}
      style={style}
    >
      <Component {...props} />
    </LazyLoad>
  )
}

// Lazy Route Component
interface LazyRouteProps {
  component: React.ComponentType<any>
  fallback?: ReactNode
  threshold?: number
  rootMargin?: string
}

export const LazyRoute: React.FC<LazyRouteProps> = ({
  component: Component,
  fallback = <LoadingState />,
  threshold = 0.1,
  rootMargin = '50px',
}) => {
  return (
    <LazyLoad
      fallback={fallback}
      threshold={threshold}
      rootMargin={rootMargin}
    >
      <Component />
    </LazyLoad>
  )
}

// Lazy Gallery Component
interface LazyGalleryProps {
  images: Array<{
    src: string
    alt: string
    thumbnail?: string
  }>
  columns?: number
  gap?: number
  className?: string
  onImageClick?: (index: number) => void
}

export const LazyGallery: React.FC<LazyGalleryProps> = ({
  images,
  columns = 3,
  gap = 4,
  className = '',
  onImageClick,
}) => {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap * 0.25}rem`,
  }

  return (
    <div className={className} style={gridStyle}>
      {images.map((image, index) => (
        <LazyImage
          key={index}
          src={image.src}
          alt={image.alt}
          placeholder={image.thumbnail}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onImageClick?.(index)}
        />
      ))}
    </div>
  )
}

// Lazy List Component
interface LazyListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  itemHeight?: number
  containerHeight?: number
  threshold?: number
  rootMargin?: string
  className?: string
}

export const LazyList: React.FC<LazyListProps<any>> = ({
  items,
  renderItem,
  itemHeight = 100,
  containerHeight = 400,
  threshold = 0.1,
  rootMargin = '50px',
  className = '',
}) => {
  const [visibleItems, setVisibleItems] = useState<number[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const { isIntersecting } = useIntersectionObserver(containerRef, {
    threshold,
    rootMargin,
  })

  useEffect(() => {
    if (isIntersecting) {
      setVisibleItems(items.map((_, index) => index))
    }
  }, [isIntersecting, items])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height: containerHeight, overflow: 'auto' }}
    >
      {visibleItems.map((index) => (
        <div
          key={index}
          style={{ height: itemHeight }}
          className="flex items-center"
        >
          {renderItem(items[index], index)}
        </div>
      ))}
    </div>
  )
}

// Lazy Modal Component
interface LazyModalProps {
  isOpen: boolean
  onClose: () => void
  component: React.ComponentType<any>
  props?: Record<string, any>
  fallback?: ReactNode
  threshold?: number
  rootMargin?: string
  className?: string
}

export const LazyModal: React.FC<LazyModalProps> = ({
  isOpen,
  onClose,
  component: Component,
  props = {},
  fallback = <LoadingState />,
  threshold = 0.1,
  rootMargin = '50px',
  className = '',
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`bg-white rounded-lg shadow-lg max-w-4xl max-h-[90vh] overflow-auto ${className}`}>
        <LazyLoad
          fallback={fallback}
          threshold={threshold}
          rootMargin={rootMargin}
        >
          <Component {...props} onClose={onClose} />
        </LazyLoad>
      </div>
    </div>
  )
}
