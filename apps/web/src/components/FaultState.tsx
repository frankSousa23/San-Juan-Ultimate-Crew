import React from 'react'

interface FaultStateProps {
  title?: string
  message: string
  onRetry?: () => void
  onGoBack?: () => void
  showDetails?: boolean
  details?: string
}

export const FaultState: React.FC<FaultStateProps> = ({
  title = 'Algo salió mal',
  message,
  onRetry,
  onGoBack,
  showDetails = false,
  details
}) => {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{message}</p>
      
      {showDetails && details && (
        <details className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md mb-6 max-w-md mx-auto">
          <summary className="cursor-pointer font-medium">Detalles del error</summary>
          <pre className="whitespace-pre-wrap text-left mt-2 text-xs">{details}</pre>
        </details>
      )}
      
      <div className="flex gap-3 justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            🔄 Reintentar
          </button>
        )}
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            ← Volver
          </button>
        )}
      </div>
    </div>
  )
}

// Specific error states for common scenarios
export const NetworkError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <FaultState
    title="Error de conexión"
    message="No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta nuevamente."
    onRetry={onRetry}
  />
)

export const NotFoundError: React.FC<{ onGoBack?: () => void }> = ({ onGoBack }) => (
  <FaultState
    title="No encontrado"
    message="El recurso que buscas no existe o ha sido eliminado."
    onGoBack={onGoBack}
  />
)

export const UnauthorizedError: React.FC<{ onGoBack?: () => void }> = ({ onGoBack }) => (
  <FaultState
    title="Acceso denegado"
    message="No tienes permisos para acceder a este recurso."
    onGoBack={onGoBack}
  />
)

export const ServerError: React.FC<{ onRetry?: () => void; details?: string }> = ({ 
  onRetry, 
  details 
}) => (
  <FaultState
    title="Error del servidor"
    message="Ocurrió un error interno en el servidor. Nuestro equipo ha sido notificado."
    onRetry={onRetry}
    showDetails={!!details}
    details={details}
  />
)

export const ValidationError: React.FC<{ 
  onRetry?: () => void; 
  details?: string;
  field?: string;
}> = ({ onRetry, details, field }) => (
  <FaultState
    title={field ? `Error en ${field}` : "Error de validación"}
    message="Los datos proporcionados no son válidos. Por favor, revisa la información e intenta nuevamente."
    onRetry={onRetry}
    showDetails={!!details}
    details={details}
  />
)

// Inline error component for forms and smaller areas
export const InlineError: React.FC<{ 
  message: string; 
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info';
}> = ({ message, onDismiss, type = 'error' }) => {
  const typeClasses = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  const iconClasses = {
    error: '⚠️',
    warning: '⚠️',
    info: 'ℹ️'
  }

  return (
    <div className={`rounded-md border p-3 ${typeClasses[type]} flex items-start justify-between`}>
      <div className="flex items-start">
        <span className="mr-2">{iconClasses[type]}</span>
        <p className="text-sm">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-2 text-gray-400 hover:text-gray-600"
          aria-label="Cerrar"
        >
          ✕
        </button>
      )}
    </div>
  )
}

// Error boundary fallback component
export const FaultBoundaryFallback: React.FC<{ 
  error: Error; 
  onRetry?: () => void;
}> = ({ error, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
      <div className="text-center">
        <div className="text-6xl mb-4">💥</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Oops! Algo salió mal</h1>
        <p className="text-gray-600 mb-4">
          Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
        </p>
        
        <details className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md mb-4 text-left">
          <summary className="cursor-pointer font-medium">Detalles técnicos</summary>
          <pre className="whitespace-pre-wrap mt-2 text-xs">{error.message}</pre>
          {error.stack && (
            <pre className="whitespace-pre-wrap mt-2 text-xs opacity-75">{error.stack}</pre>
          )}
        </details>
        
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              🔄 Reintentar
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            🔄 Recargar página
          </button>
        </div>
      </div>
    </div>
  </div>
)
