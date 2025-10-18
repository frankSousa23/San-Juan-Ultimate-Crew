import React from 'react'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  size?: 'sm' | 'md' | 'lg'
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📋',
  title,
  description,
  action,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16'
  }

  const iconSizeClasses = {
    sm: 'text-3xl',
    md: 'text-4xl',
    lg: 'text-6xl'
  }

  return (
    <div className={`text-center ${sizeClasses[size]}`}>
      <div className={`${iconSizeClasses[size]} mb-4`}>{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

// Predefined empty states for common scenarios
export const EmptyPlayers: React.FC<{ onCreatePlayer?: () => void }> = ({ onCreatePlayer }) => (
  <EmptyState
    icon="👥"
    title="No hay jugadores registrados"
    description="Comienza agregando jugadores al roster del equipo."
    action={onCreatePlayer ? {
      label: 'Agregar Primer Jugador',
      onClick: onCreatePlayer
    } : undefined}
  />
)

export const EmptyEvents: React.FC<{ onCreateEvent?: () => void }> = ({ onCreateEvent }) => (
  <EmptyState
    icon="📅"
    title="No hay eventos programados"
    description="Crea tu primer evento para comenzar a organizar el equipo."
    action={onCreateEvent ? {
      label: 'Crear Primer Evento',
      onClick: onCreateEvent
    } : undefined}
  />
)

export const EmptyMessages: React.FC<{ onSendMessage?: () => void }> = ({ onSendMessage }) => (
  <EmptyState
    icon="💬"
    title="No hay mensajes aún"
    description="Sé el primero en enviar un mensaje en este canal."
    action={onSendMessage ? {
      label: 'Enviar Mensaje',
      onClick: onSendMessage
    } : undefined}
  />
)

export const EmptyResources: React.FC<{ onAddResource?: () => void }> = ({ onAddResource }) => (
  <EmptyState
    icon="📁"
    title="No hay recursos disponibles"
    description="Comienza agregando documentos, enlaces o archivos útiles para el equipo."
    action={onAddResource ? {
      label: 'Agregar Recurso',
      onClick: onAddResource
    } : undefined}
  />
)

export const EmptyTransactions: React.FC<{ onAddTransaction?: () => void }> = ({ onAddTransaction }) => (
  <EmptyState
    icon="💰"
    title="No hay transacciones registradas"
    description="Comienza registrando los ingresos y gastos del equipo."
    action={onAddTransaction ? {
      label: 'Agregar Transacción',
      onClick: onAddTransaction
    } : undefined}
  />
)

export const EmptyInjuries: React.FC<{ onAddInjury?: () => void }> = ({ onAddInjury }) => (
  <EmptyState
    icon="🏥"
    title="No hay lesiones registradas"
    description="¡Excelente! El equipo está en buen estado físico."
    action={onAddInjury ? {
      label: 'Registrar Lesión',
      onClick: onAddInjury
    } : undefined}
  />
)

export const EmptyRivals: React.FC<{ onAddRival?: () => void }> = ({ onAddRival }) => (
  <EmptyState
    icon="⚔️"
    title="No hay rivales registrados"
    description="Comienza agregando información sobre los equipos rivales."
    action={onAddRival ? {
      label: 'Agregar Rival',
      onClick: onAddRival
    } : undefined}
  />
)
