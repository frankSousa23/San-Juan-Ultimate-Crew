import React, { useEffect, useState } from 'react'
import { useDataContext } from '../contexts/DataContext'
import { LoadingState } from './LoadingState'
import { ErrorState } from './ErrorState'

interface DataInitializerProps {
  children: React.ReactNode
}

export const DataInitializer: React.FC<DataInitializerProps> = ({ children }) => {
  const {
    fetchPlayers,
    fetchEvents,
    fetchTransactions,
    fetchAccounts,
    fetchCategories,
    fetchInjuries,
    fetchRivals,
    fetchPlays,
    fetchResources,
    fetchChannels,
    fetchAttendance,
    state
  } = useDataContext()

  const [isInitializing, setIsInitializing] = useState(true)
  const [initializationError, setInitializationError] = useState<string | null>(null)

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsInitializing(true)
        setInitializationError(null)

        // Load all essential data in parallel
        await Promise.all([
          fetchPlayers(),
          fetchEvents(),
          fetchTransactions(),
          fetchAccounts(),
          fetchCategories(),
          fetchInjuries(),
          fetchRivals(),
          fetchPlays(),
          fetchResources(),
          fetchChannels(),
          fetchAttendance(),
        ])

        setIsInitializing(false)
      } catch (error) {
        console.error('Error initializing data:', error)
        setInitializationError(
          error instanceof Error ? error.message : 'Error al cargar los datos iniciales'
        )
        setIsInitializing(false)
      }
    }

    initializeData()
  }, [
    fetchPlayers,
    fetchEvents,
    fetchTransactions,
    fetchAccounts,
    fetchCategories,
    fetchInjuries,
    fetchRivals,
    fetchPlays,
    fetchResources,
    fetchChannels,
    fetchAttendance,
  ])

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingState />
          <p className="mt-4 text-gray-600">Cargando datos de la aplicación...</p>
        </div>
      </div>
    )
  }

  if (initializationError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full">
          <ErrorState
            title="Error al cargar datos"
            message={initializationError}
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Hook to check if data is ready
export function useDataReady() {
  const { state } = useDataContext()
  
  const isReady = !Object.values(state.loading).some(loading => loading)
  const hasErrors = Object.values(state.errors).some(error => error !== null)
  
  return {
    isReady,
    hasErrors,
    errors: state.errors,
    loading: state.loading
  }
}
