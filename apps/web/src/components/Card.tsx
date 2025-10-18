import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  clickable?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  border?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  clickable = false,
  onClick,
  padding = 'md',
  shadow = 'md',
  rounded = 'lg',
  border = false
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  }

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl'
  }

  const baseClasses = 'bg-white'
  const interactiveClasses = clickable || onClick ? 'cursor-pointer' : ''
  const hoverClasses = hover ? 'hover:shadow-lg transition-shadow duration-200' : ''
  const borderClasses = border ? 'border border-gray-200' : ''

  const combinedClasses = [
    baseClasses,
    paddingClasses[padding],
    shadowClasses[shadow],
    roundedClasses[rounded],
    borderClasses,
    interactiveClasses,
    hoverClasses,
    className
  ].filter(Boolean).join(' ')

  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      className={combinedClasses}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      {children}
    </Component>
  )
}

// Specialized card components
interface PlayerCardProps {
  player: {
    id: number
    name: string
    number: number
    position: 'HANDLER' | 'CUTTER' | 'HYBRID'
    status: 'ACTIVE' | 'INJURED' | 'INACTIVE'
    experience?: string
    heightCm?: number
  }
  onClick?: () => void
  showDetails?: boolean
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  onClick,
  showDetails = false
}) => {
  const positionColors = {
    HANDLER: 'bg-gradient-to-br from-sky-500 to-cyan-400',
    CUTTER: 'bg-gradient-to-br from-emerald-500 to-teal-400',
    HYBRID: 'bg-gradient-to-br from-fuchsia-500 to-yellow-300'
  }

  const statusColors = {
    ACTIVE: 'text-green-600',
    INJURED: 'text-red-600',
    INACTIVE: 'text-gray-600'
  }

  return (
    <Card
      clickable={!!onClick}
      onClick={onClick}
      hover={!!onClick}
      className="overflow-hidden"
    >
      <div className={`${positionColors[player.position]} p-4 text-white text-center`}>
        <div className="text-lg font-bold">#{player.number}</div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-800 mb-1">{player.name}</h3>
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-gray-600">{player.position}</span>
          <span className={`text-xs font-semibold ${statusColors[player.status]}`}>
            {player.status}
          </span>
        </div>
        {showDetails && (
          <div className="text-xs text-gray-500 space-y-1">
            {player.experience && <div>Exp: {player.experience}</div>}
            {player.heightCm && <div>Altura: {player.heightCm} cm</div>}
          </div>
        )}
      </div>
    </Card>
  )
}

interface EventCardProps {
  event: {
    id: number
    title: string
    description?: string
    type: 'TRAINING' | 'TOURNAMENT' | 'SOCIAL' | 'WORKSHOP'
    status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
    location?: string
    startsAt: string
    endsAt?: string
  }
  onClick?: () => void
  showDetails?: boolean
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onClick,
  showDetails = false
}) => {
  const typeColors = {
    TRAINING: 'bg-blue-100 text-blue-800',
    TOURNAMENT: 'bg-purple-100 text-purple-800',
    SOCIAL: 'bg-green-100 text-green-800',
    WORKSHOP: 'bg-yellow-100 text-yellow-800'
  }

  const statusColors = {
    UPCOMING: 'bg-gray-100 text-gray-800',
    ONGOING: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-red-100 text-red-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card
      clickable={!!onClick}
      onClick={onClick}
      hover={!!onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{event.title}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[event.status]}`}>
          {event.status}
        </span>
      </div>
      
      <div className="mb-3">
        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${typeColors[event.type]}`}>
          {event.type}
        </span>
      </div>

      {showDetails && event.description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
      )}

      <div className="text-sm text-gray-500 space-y-1">
        <div className="flex items-center">
          <span className="mr-2">📅</span>
          {formatDate(event.startsAt)}
        </div>
        {event.location && (
          <div className="flex items-center">
            <span className="mr-2">📍</span>
            {event.location}
          </div>
        )}
        {event.endsAt && (
          <div className="flex items-center">
            <span className="mr-2">⏰</span>
            Hasta: {formatDate(event.endsAt)}
          </div>
        )}
      </div>
    </Card>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red'
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue'
}) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-1">
              <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`${colorClasses[color]} text-white p-3 rounded-lg`}>
            <span className="text-2xl">{icon}</span>
          </div>
        )}
      </div>
    </Card>
  )
}
