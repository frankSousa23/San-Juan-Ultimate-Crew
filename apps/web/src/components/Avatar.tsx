import React from 'react'

interface AvatarProps {
  src?: string
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  shape?: 'circle' | 'square'
  status?: 'online' | 'offline' | 'away' | 'busy'
  fallbackIcon?: string
  className?: string
  onClick?: () => void
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  shape = 'circle',
  status,
  fallbackIcon = '👤',
  className = '',
  onClick
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  }

  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-lg'
  }

  const statusClasses = {
    online: 'bg-green-400',
    offline: 'bg-gray-400',
    away: 'bg-yellow-400',
    busy: 'bg-red-400'
  }

  const statusSizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
    '2xl': 'w-4 h-4'
  }

  const baseClasses = 'relative inline-flex items-center justify-center bg-gray-200 text-gray-600 font-medium overflow-hidden'
  const interactiveClasses = onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''

  const combinedClasses = [
    baseClasses,
    sizeClasses[size],
    shapeClasses[shape],
    interactiveClasses,
    className
  ].filter(Boolean).join(' ')

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Generate background color based on name
  const getBackgroundColor = (name: string) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500'
    ]
    
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <div className="relative inline-block">
      <div className={combinedClasses} onClick={onClick}>
        {src ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials or icon if image fails to load
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent) {
                parent.innerHTML = name ? getInitials(name) : fallbackIcon
                parent.className = parent.className.replace('bg-gray-200', getBackgroundColor(name || 'User'))
              }
            }}
          />
        ) : name ? (
          <span className={getBackgroundColor(name) + ' text-white'}>
            {getInitials(name)}
          </span>
        ) : (
          <span className="text-gray-400">
            {fallbackIcon}
          </span>
        )}
      </div>
      
      {status && (
        <span
          className={`absolute bottom-0 right-0 ${statusSizeClasses[size]} ${statusClasses[status]} ${shapeClasses[shape]} border-2 border-white`}
        />
      )}
    </div>
  )
}

// Avatar Group for displaying multiple avatars
interface AvatarGroupProps {
  avatars: Array<{
    src?: string
    name?: string
    alt?: string
  }>
  max?: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  shape?: 'circle' | 'square'
  spacing?: 'tight' | 'normal' | 'loose'
  showTooltip?: boolean
  className?: string
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 3,
  size = 'md',
  shape = 'circle',
  spacing = 'normal',
  showTooltip = false,
  className = ''
}) => {
  const spacingClasses = {
    tight: '-space-x-1',
    normal: '-space-x-2',
    loose: '-space-x-3'
  }

  const visibleAvatars = avatars.slice(0, max)
  const remainingCount = avatars.length - max

  return (
    <div className={`flex items-center ${spacingClasses[spacing]} ${className}`}>
      {visibleAvatars.map((avatar, index) => (
        <div key={index} className="relative">
          <Avatar
            src={avatar.src}
            name={avatar.name}
            alt={avatar.alt}
            size={size}
            shape={shape}
          />
          {showTooltip && avatar.name && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {avatar.name}
            </div>
          )}
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div className="relative">
          <Avatar
            name={`+${remainingCount}`}
            size={size}
            shape={shape}
            className="bg-gray-500 text-white"
          />
          {showTooltip && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {avatars.slice(max).map(a => a.name).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Player Avatar with specific styling
interface PlayerAvatarProps {
  player: {
    id: number
    name: string
    number: number
    position: 'HANDLER' | 'CUTTER' | 'HYBRID'
    status: 'ACTIVE' | 'INJURED' | 'INACTIVE'
    avatar?: string
  }
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  showNumber?: boolean
  showStatus?: boolean
  onClick?: () => void
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  player,
  size = 'md',
  showNumber = true,
  showStatus = true,
  onClick
}) => {
  const positionColors = {
    HANDLER: 'border-blue-500',
    CUTTER: 'border-green-500',
    HYBRID: 'border-purple-500'
  }

  const statusMap = {
    ACTIVE: 'online' as const,
    INJURED: 'busy' as const,
    INACTIVE: 'offline' as const
  }

  return (
    <div className="relative">
      <Avatar
        src={player.avatar}
        name={player.name}
        alt={player.name}
        size={size}
        shape="circle"
        status={showStatus ? statusMap[player.status] : undefined}
        onClick={onClick}
        className={`border-2 ${positionColors[player.position]}`}
      />
      {showNumber && (
        <div className="absolute -bottom-1 -right-1 bg-white border-2 border-gray-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-700">
          {player.number}
        </div>
      )}
    </div>
  )
}
