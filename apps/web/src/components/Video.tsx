import React, { useState, useRef } from 'react'

interface VideoProps {
  src: string
  poster?: string
  width?: string | number
  height?: string | number
  controls?: boolean
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  preload?: 'none' | 'metadata' | 'auto'
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

export const Video: React.FC<VideoProps> = ({
  src,
  poster,
  width,
  height,
  controls = true,
  autoplay = false,
  loop = false,
  muted = false,
  preload = 'metadata',
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
  const videoRef = useRef<HTMLVideoElement>(null)

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

  const handlePlay = () => {
    if (onPlay) onPlay()
  }

  const handlePause = () => {
    if (onPause) onPause()
  }

  const handleEnded = () => {
    if (onEnded) onEnded()
  }

  const videoStyle: React.CSSProperties = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  }

  const videoClasses = [
    'transition-opacity duration-300',
    isLoading ? 'opacity-0' : 'opacity-100',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className="relative inline-block">
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={videoStyle}
        >
          <span className="text-gray-400 text-sm">Loading video...</span>
        </div>
      )}
      
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls={controls}
        autoPlay={autoplay}
        loop={loop}
        muted={muted}
        preload={preload}
        className={videoClasses}
        style={videoStyle}
        onClick={onClick}
        onLoadedData={handleLoad}
        onError={handleError}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
      
      {hasError && (
        <div
          className="absolute inset-0 bg-gray-100 flex items-center justify-center"
          style={videoStyle}
        >
          <span className="text-gray-400 text-sm">Video not found</span>
        </div>
      )}
    </div>
  )
}

// Responsive Video component
interface ResponsiveVideoProps {
  src: string
  poster?: string
  controls?: boolean
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  preload?: 'none' | 'metadata' | 'auto'
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

export const ResponsiveVideo: React.FC<ResponsiveVideoProps> = ({
  src,
  poster,
  controls = true,
  autoplay = false,
  loop = false,
  muted = false,
  preload = 'metadata',
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
    <Video
      src={src}
      poster={poster}
      width="100%"
      height="auto"
      controls={controls}
      autoplay={autoplay}
      loop={loop}
      muted={muted}
      preload={preload}
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

// Background Video component
interface BackgroundVideoProps {
  src: string
  poster?: string
  width?: string | number
  height?: string | number
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  preload?: 'none' | 'metadata' | 'auto'
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

export const BackgroundVideo: React.FC<BackgroundVideoProps> = ({
  src,
  poster,
  width,
  height,
  autoplay = true,
  loop = true,
  muted = true,
  preload = 'metadata',
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
    <Video
      src={src}
      poster={poster}
      width={width}
      height={height}
      controls={false}
      autoplay={autoplay}
      loop={loop}
      muted={muted}
      preload={preload}
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

// Video Player component
interface VideoPlayerProps {
  src: string
  poster?: string
  width?: string | number
  height?: string | number
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  preload?: 'none' | 'metadata' | 'auto'
  showControls?: boolean
  showPlayButton?: boolean
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

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  width,
  height,
  autoplay = false,
  loop = false,
  muted = false,
  preload = 'metadata',
  showControls = true,
  showPlayButton = true,
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
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

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

  const handlePlay = () => {
    setIsPlaying(true)
    if (onPlay) onPlay()
  }

  const handlePause = () => {
    setIsPlaying(false)
    if (onPause) onPause()
  }

  const handleEnded = () => {
    setIsPlaying(false)
    if (onEnded) onEnded()
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const videoStyle: React.CSSProperties = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  }

  const videoClasses = [
    'transition-opacity duration-300',
    isLoading ? 'opacity-0' : 'opacity-100',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className="relative inline-block group">
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={videoStyle}
        >
          <span className="text-gray-400 text-sm">Loading video...</span>
        </div>
      )}
      
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls={showControls}
        autoPlay={autoplay}
        loop={loop}
        muted={muted}
        preload={preload}
        className={videoClasses}
        style={videoStyle}
        onClick={onClick}
        onLoadedData={handleLoad}
        onError={handleError}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
      
      {showPlayButton && !showControls && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <svg
            className="w-16 h-16"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
      
      {hasError && (
        <div
          className="absolute inset-0 bg-gray-100 flex items-center justify-center"
          style={videoStyle}
        >
          <span className="text-gray-400 text-sm">Video not found</span>
        </div>
      )}
    </div>
  )
}
