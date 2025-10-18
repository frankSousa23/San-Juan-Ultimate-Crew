import React, { useState, useRef } from 'react'

interface IframeProps {
  src: string
  title?: string
  width?: string | number
  height?: string | number
  allowFullScreen?: boolean
  sandbox?: string
  loading?: 'lazy' | 'eager'
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  onLoad?: () => void
  onError?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const Iframe: React.FC<IframeProps> = ({
  src,
  title,
  width,
  height,
  allowFullScreen = false,
  sandbox,
  loading = 'lazy',
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
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
    if (onLoad) onLoad()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    if (onError) onError()
  }

  const iframeStyle: React.CSSProperties = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  }

  const iframeClasses = [
    'transition-opacity duration-300',
    isLoading ? 'opacity-0' : 'opacity-100',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className="relative inline-block">
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={iframeStyle}
        >
          <span className="text-gray-400 text-sm">Loading content...</span>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        width={width}
        height={height}
        allowFullScreen={allowFullScreen}
        sandbox={sandbox}
        loading={loading}
        className={iframeClasses}
        style={iframeStyle}
        onClick={onClick}
        onLoad={handleLoad}
        onError={handleError}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
      
      {hasError && (
        <div
          className="absolute inset-0 bg-gray-100 flex items-center justify-center"
          style={iframeStyle}
        >
          <span className="text-gray-400 text-sm">Content not found</span>
        </div>
      )}
    </div>
  )
}

// Responsive Iframe component
interface ResponsiveIframeProps {
  src: string
  title?: string
  allowFullScreen?: boolean
  sandbox?: string
  loading?: 'lazy' | 'eager'
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  onLoad?: () => void
  onError?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const ResponsiveIframe: React.FC<ResponsiveIframeProps> = ({
  src,
  title,
  allowFullScreen = false,
  sandbox,
  loading = 'lazy',
  className = '',
  style = {},
  onClick,
  onLoad,
  onError,
  onMouseEnter,
  onMouseLeave
}) => {
  return (
    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
      <Iframe
        src={src}
        title={title}
        width="100%"
        height="100%"
        allowFullScreen={allowFullScreen}
        sandbox={sandbox}
        loading={loading}
        className={`absolute inset-0 ${className}`}
        style={style}
        onClick={onClick}
        onLoad={onLoad}
        onError={onError}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    </div>
  )
}

// YouTube Iframe component
interface YouTubeIframeProps {
  videoId: string
  title?: string
  width?: string | number
  height?: string | number
  allowFullScreen?: boolean
  loading?: 'lazy' | 'eager'
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  onLoad?: () => void
  onError?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const YouTubeIframe: React.FC<YouTubeIframeProps> = ({
  videoId,
  title,
  width,
  height,
  allowFullScreen = true,
  loading = 'lazy',
  className = '',
  style = {},
  onClick,
  onLoad,
  onError,
  onMouseEnter,
  onMouseLeave
}) => {
  const youtubeSrc = `https://www.youtube.com/embed/${videoId}`

  return (
    <Iframe
      src={youtubeSrc}
      title={title}
      width={width}
      height={height}
      allowFullScreen={allowFullScreen}
      loading={loading}
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

// Vimeo Iframe component
interface VimeoIframeProps {
  videoId: string
  title?: string
  width?: string | number
  height?: string | number
  allowFullScreen?: boolean
  loading?: 'lazy' | 'eager'
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  onLoad?: () => void
  onError?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const VimeoIframe: React.FC<VimeoIframeProps> = ({
  videoId,
  title,
  width,
  height,
  allowFullScreen = true,
  loading = 'lazy',
  className = '',
  style = {},
  onClick,
  onLoad,
  onError,
  onMouseEnter,
  onMouseLeave
}) => {
  const vimeoSrc = `https://player.vimeo.com/video/${videoId}`

  return (
    <Iframe
      src={vimeoSrc}
      title={title}
      width={width}
      height={height}
      allowFullScreen={allowFullScreen}
      loading={loading}
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

// Google Maps Iframe component
interface GoogleMapsIframeProps {
  src: string
  title?: string
  width?: string | number
  height?: string | number
  allowFullScreen?: boolean
  loading?: 'lazy' | 'eager'
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  onLoad?: () => void
  onError?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const GoogleMapsIframe: React.FC<GoogleMapsIframeProps> = ({
  src,
  title,
  width,
  height,
  allowFullScreen = false,
  loading = 'lazy',
  className = '',
  style = {},
  onClick,
  onLoad,
  onError,
  onMouseEnter,
  onMouseLeave
}) => {
  return (
    <Iframe
      src={src}
      title={title}
      width={width}
      height={height}
      allowFullScreen={allowFullScreen}
      loading={loading}
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

// Embed Iframe component
interface EmbedIframeProps {
  src: string
  title?: string
  width?: string | number
  height?: string | number
  allowFullScreen?: boolean
  sandbox?: string
  loading?: 'lazy' | 'eager'
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  onLoad?: () => void
  onError?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const EmbedIframe: React.FC<EmbedIframeProps> = ({
  src,
  title,
  width,
  height,
  allowFullScreen = false,
  sandbox,
  loading = 'lazy',
  className = '',
  style = {},
  onClick,
  onLoad,
  onError,
  onMouseEnter,
  onMouseLeave
}) => {
  return (
    <Iframe
      src={src}
      title={title}
      width={width}
      height={height}
      allowFullScreen={allowFullScreen}
      sandbox={sandbox}
      loading={loading}
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