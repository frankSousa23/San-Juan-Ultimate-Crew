import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  dot?: boolean
  removable?: boolean
  onRemove?: () => void
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  rounded = 'full',
  dot = false,
  removable = false,
  onRemove,
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center font-medium'
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-indigo-100 text-indigo-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  }

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-sm'
  }

  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  }

  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    roundedClasses[rounded],
    className
  ].filter(Boolean).join(' ')

  return (
    <span className={combinedClasses}>
      {dot && (
        <span className="w-1.5 h-1.5 bg-current rounded-full mr-1.5" />
      )}
      {children}
      {removable && onRemove && (
        <button
          onClick={onRemove}
          className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
          aria-label="Remove"
        >
          <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </span>
  )
}

// Status Badge for specific use cases
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'draft' | 'published'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showDot?: boolean
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  showDot = true
}) => {
  const statusConfig = {
    active: { variant: 'success' as const, label: 'Activo' },
    inactive: { variant: 'default' as const, label: 'Inactivo' },
    pending: { variant: 'warning' as const, label: 'Pendiente' },
    completed: { variant: 'success' as const, label: 'Completado' },
    cancelled: { variant: 'danger' as const, label: 'Cancelado' },
    draft: { variant: 'default' as const, label: 'Borrador' },
    published: { variant: 'success' as const, label: 'Publicado' }
  }

  const config = statusConfig[status]

  return (
    <Badge
      variant={config.variant}
      size={size}
      dot={showDot}
    >
      {config.label}
    </Badge>
  )
}

// Player Status Badge
interface PlayerStatusBadgeProps {
  status: 'ACTIVE' | 'INJURED' | 'INACTIVE'
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

export const PlayerStatusBadge: React.FC<PlayerStatusBadgeProps> = ({
  status,
  size = 'sm'
}) => {
  const statusConfig = {
    ACTIVE: { variant: 'success' as const, label: 'Activo', icon: '✅' },
    INJURED: { variant: 'danger' as const, label: 'Lesionado', icon: '🏥' },
    INACTIVE: { variant: 'default' as const, label: 'Inactivo', icon: '⏸️' }
  }

  const config = statusConfig[status]

  return (
    <Badge
      variant={config.variant}
      size={size}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  )
}

// Event Status Badge
interface EventStatusBadgeProps {
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

export const EventStatusBadge: React.FC<EventStatusBadgeProps> = ({
  status,
  size = 'sm'
}) => {
  const statusConfig = {
    UPCOMING: { variant: 'info' as const, label: 'Próximo', icon: '📅' },
    ONGOING: { variant: 'success' as const, label: 'En curso', icon: '🟢' },
    COMPLETED: { variant: 'default' as const, label: 'Completado', icon: '✅' },
    CANCELLED: { variant: 'danger' as const, label: 'Cancelado', icon: '❌' }
  }

  const config = statusConfig[status]

  return (
    <Badge
      variant={config.variant}
      size={size}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  )
}

// Event Type Badge
interface EventTypeBadgeProps {
  type: 'TRAINING' | 'TOURNAMENT' | 'SOCIAL' | 'WORKSHOP'
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

export const EventTypeBadge: React.FC<EventTypeBadgeProps> = ({
  type,
  size = 'sm'
}) => {
  const typeConfig = {
    TRAINING: { variant: 'primary' as const, label: 'Entrenamiento', icon: '🏃' },
    TOURNAMENT: { variant: 'warning' as const, label: 'Torneo', icon: '🏆' },
    SOCIAL: { variant: 'success' as const, label: 'Social', icon: '🎉' },
    WORKSHOP: { variant: 'info' as const, label: 'Taller', icon: '📚' }
  }

  const config = typeConfig[type]

  return (
    <Badge
      variant={config.variant}
      size={size}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  )
}

// Player Position Badge
interface PlayerPositionBadgeProps {
  position: 'HANDLER' | 'CUTTER' | 'HYBRID'
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

export const PlayerPositionBadge: React.FC<PlayerPositionBadgeProps> = ({
  position,
  size = 'sm'
}) => {
  const positionConfig = {
    HANDLER: { variant: 'info' as const, label: 'Manejador', icon: '🎯' },
    CUTTER: { variant: 'success' as const, label: 'Cortador', icon: '🏃' },
    HYBRID: { variant: 'warning' as const, label: 'Híbrido', icon: '🔄' }
  }

  const config = positionConfig[position]

  return (
    <Badge
      variant={config.variant}
      size={size}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  )
}

// Transaction Type Badge
interface TransactionTypeBadgeProps {
  type: 'INCOME' | 'EXPENSE'
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

export const TransactionTypeBadge: React.FC<TransactionTypeBadgeProps> = ({
  type,
  size = 'sm'
}) => {
  const typeConfig = {
    INCOME: { variant: 'success' as const, label: 'Ingreso', icon: '💰' },
    EXPENSE: { variant: 'danger' as const, label: 'Gasto', icon: '💸' }
  }

  const config = typeConfig[type]

  return (
    <Badge
      variant={config.variant}
      size={size}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  )
}
