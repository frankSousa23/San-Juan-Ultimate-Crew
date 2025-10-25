import React, { useState, useRef } from 'react'

interface EmbedProps {
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

export const Embed: React.FC<EmbedProps> = ({
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
  const embedRef = useRef<HTMLIFrameElement>(null)

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

  const embedStyle: React.CSSProperties = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  }

  const embedClasses = [
    'transition-opacity duration-300',
    isLoading ? 'opacity-0' : 'opacity-100',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className="relative inline-block">
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={embedStyle}
        >
          <span className="text-gray-400 text-sm">Loading content...</span>
        </div>
      )}
      
      <iframe
        ref={embedRef}
        src={src}
        title={title}
        width={width}
        height={height}
        allowFullScreen={allowFullScreen}
        sandbox={sandbox}
        loading={loading}
        className={embedClasses}
        style={embedStyle}
        onClick={onClick}
        onLoad={handleLoad}
        onError={handleError}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
      
      {hasError && (
        <div
          className="absolute inset-0 bg-gray-100 flex items-center justify-center"
          style={embedStyle}
        >
          <span className="text-gray-400 text-sm">Content not found</span>
        </div>
      )}
    </div>
  )
}

// Responsive Embed component
interface ResponsiveEmbedProps {
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

export const ResponsiveEmbed: React.FC<ResponsiveEmbedProps> = ({
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
      <Embed
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

// YouTube Embed component
interface YouTubeEmbedProps {
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

export const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
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
    <Embed
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

// Vimeo Embed component
interface VimeoEmbedProps {
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

export const VimeoEmbed: React.FC<VimeoEmbedProps> = ({
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
    <Embed
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

// Google Maps Embed component
interface GoogleMapsEmbedProps {
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

export const GoogleMapsEmbed: React.FC<GoogleMapsEmbedProps> = ({
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
    <Embed
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

// Twitter Embed component
interface TwitterEmbedProps {
  tweetId: string
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

export const TwitterEmbed: React.FC<TwitterEmbedProps> = ({
  tweetId,
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
  const twitterSrc = `https://twitframe.com/show?url=https://twitter.com/i/status/${tweetId}`

  return (
    <Embed
      src={twitterSrc}
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

// Instagram Embed component
interface InstagramEmbedProps {
  postId: string
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

export const InstagramEmbed: React.FC<InstagramEmbedProps> = ({
  postId,
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
  const instagramSrc = `https://www.instagram.com/p/${postId}/embed/`

  return (
    <Embed
      src={instagramSrc}
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

// Facebook Embed component
interface FacebookEmbedProps {
  postId: string
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

export const FacebookEmbed: React.FC<FacebookEmbedProps> = ({
  postId,
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
  const facebookSrc = `https://www.facebook.com/plugins/post.php?href=https://www.facebook.com/posts/${postId}`

  return (
    <Embed
      src={facebookSrc}
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
