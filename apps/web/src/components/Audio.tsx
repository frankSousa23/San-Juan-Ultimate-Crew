import React, { useState, useRef } from 'react'

interface AudioProps {
  src: string
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

export const Audio: React.FC<AudioProps> = ({
  src,
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
  const audioRef = useRef<HTMLAudioElement>(null)

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

  const audioClasses = [
    'transition-opacity duration-300',
    isLoading ? 'opacity-0' : 'opacity-100',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className="relative inline-block">
      {isLoading && (
        <div className="bg-gray-200 animate-pulse p-4 rounded">
          <span className="text-gray-400 text-sm">Loading audio...</span>
        </div>
      )}
      
      <audio
        ref={audioRef}
        src={src}
        controls={controls}
        autoPlay={autoplay}
        loop={loop}
        muted={muted}
        preload={preload}
        className={audioClasses}
        style={style}
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
        <div className="bg-gray-100 p-4 rounded">
          <span className="text-gray-400 text-sm">Audio not found</span>
        </div>
      )}
    </div>
  )
}

// Audio Player component
interface AudioPlayerProps {
  src: string
  title?: string
  artist?: string
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

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title,
  artist,
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
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
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

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const audioClasses = [
    'transition-opacity duration-300',
    isLoading ? 'opacity-0' : 'opacity-100',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className="relative inline-block group">
      {isLoading && (
        <div className="bg-gray-200 animate-pulse p-4 rounded">
          <span className="text-gray-400 text-sm">Loading audio...</span>
        </div>
      )}
      
      <audio
        ref={audioRef}
        src={src}
        controls={showControls}
        autoPlay={autoplay}
        loop={loop}
        muted={muted}
        preload={preload}
        className={audioClasses}
        style={style}
        onClick={onClick}
        onLoadedData={handleLoad}
        onError={handleError}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
      
      {showPlayButton && !showControls && (
        <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-md">
          <button
            onClick={togglePlay}
            className="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          <div className="flex-1">
            {title && (
              <div className="font-medium text-gray-900">{title}</div>
            )}
            {artist && (
              <div className="text-sm text-gray-600">{artist}</div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>
      )}
      
      {hasError && (
        <div className="bg-gray-100 p-4 rounded">
          <span className="text-gray-400 text-sm">Audio not found</span>
        </div>
      )}
    </div>
  )
}

// Background Audio component
interface BackgroundAudioProps {
  src: string
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

export const BackgroundAudio: React.FC<BackgroundAudioProps> = ({
  src,
  autoplay = true,
  loop = true,
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
    <Audio
      src={src}
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
