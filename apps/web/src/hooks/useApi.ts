import { useState, useCallback } from 'react'
import { useToast } from './useToast'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: {
    onSuccess?: (data: T) => void
    onError?: (error: string) => void
    showSuccessToast?: boolean
    showErrorToast?: boolean
    successMessage?: string
  } = {}
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const toasts = useToast()

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const result = await apiFunction(...args)
      setState({ data: result, loading: false, error: null })
      
      if (options.onSuccess) {
        options.onSuccess(result)
      }
      
      if (options.showSuccessToast && options.successMessage) {
        toasts.success(options.successMessage)
      }
      
      return result
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Error desconocido'
      const status = error?.response?.status
      setState({ data: null, loading: false, error: errorMessage })
      
      if (options.onError) {
        options.onError(errorMessage)
      }
      
      // Don't show toast for 404 (endpoint doesn't exist) or 401 (auth handled by interceptor)
      if (options.showErrorToast && status !== 404 && status !== 401) {
        toasts.error(errorMessage)
      }
      
      return null
    }
  }, [apiFunction, options, toasts])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return {
    ...state,
    execute,
    reset
  }
}
