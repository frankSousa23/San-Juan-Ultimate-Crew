import React, { useState, useEffect, useCallback, useRef } from 'react'

// Servicio de optimización de estado
export interface StateOptimizationOptions {
  debounceMs?: number
  throttleMs?: number
  maxHistorySize?: number
  enableTimeTravel?: boolean
  enableSelectors?: boolean
}

export interface StateSnapshot {
  timestamp: Date
  state: any
  action: string
  diff: any
}

export interface OptimizedState {
  current: any
  history: StateSnapshot[]
  selectors: Map<string, (state: any) => any>
  subscriptions: Map<string, Set<(value: any) => void>>
}

// Clase para optimización de estado
export class StateOptimizationService {
  private static instance: StateOptimizationService
  private state: OptimizedState
  private options: Required<StateOptimizationOptions>
  private debounceTimers = new Map<string, NodeJS.Timeout>()
  private throttleTimers = new Map<string, NodeJS.Timeout>()

  constructor(options: StateOptimizationOptions = {}) {
    this.options = {
      debounceMs: options.debounceMs || 300,
      throttleMs: options.throttleMs || 100,
      maxHistorySize: options.maxHistorySize || 50,
      enableTimeTravel: options.enableTimeTravel || false,
      enableSelectors: options.enableSelectors || true,
    }

    this.state = {
      current: {},
      history: [],
      selectors: new Map(),
      subscriptions: new Map(),
    }
  }

  static getInstance(options?: StateOptimizationOptions): StateOptimizationService {
    if (!StateOptimizationService.instance) {
      StateOptimizationService.instance = new StateOptimizationService(options)
    }
    return StateOptimizationService.instance
  }

  // Actualizar estado con optimizaciones
  updateState(action: string, newState: any, options: { debounce?: boolean; throttle?: boolean } = {}): void {
    const { debounce = false, throttle = false } = options

    if (debounce) {
      this.debouncedUpdate(action, newState)
    } else if (throttle) {
      this.throttledUpdate(action, newState)
    } else {
      this.immediateUpdate(action, newState)
    }
  }

  // Actualización inmediata
  private immediateUpdate(action: string, newState: any): void {
    const oldState = this.state.current
    const diff = this.calculateDiff(oldState, newState)

    this.state.current = newState

    if (this.options.enableTimeTravel) {
      this.addToHistory(action, newState, diff)
    }

    this.notifySubscribers(diff)
  }

  // Actualización con debounce
  private debouncedUpdate(action: string, newState: any): void {
    const timerKey = `debounce_${action}`
    
    if (this.debounceTimers.has(timerKey)) {
      clearTimeout(this.debounceTimers.get(timerKey)!)
    }

    const timer = setTimeout(() => {
      this.immediateUpdate(action, newState)
      this.debounceTimers.delete(timerKey)
    }, this.options.debounceMs)

    this.debounceTimers.set(timerKey, timer)
  }

  // Actualización con throttle
  private throttledUpdate(action: string, newState: any): void {
    const timerKey = `throttle_${action}`
    
    if (!this.throttleTimers.has(timerKey)) {
      this.immediateUpdate(action, newState)
      
      const timer = setTimeout(() => {
        this.throttleTimers.delete(timerKey)
      }, this.options.throttleMs)

      this.throttleTimers.set(timerKey, timer)
    }
  }

  // Agregar a historial
  private addToHistory(action: string, state: any, diff: any): void {
    const snapshot: StateSnapshot = {
      timestamp: new Date(),
      state: JSON.parse(JSON.stringify(state)),
      action,
      diff,
    }

    this.state.history.push(snapshot)

    // Limitar tamaño del historial
    if (this.state.history.length > this.options.maxHistorySize) {
      this.state.history.shift()
    }
  }

  // Calcular diferencia entre estados
  private calculateDiff(oldState: any, newState: any): any {
    const diff: any = {}

    for (const key in newState) {
      if (oldState[key] !== newState[key]) {
        diff[key] = {
          old: oldState[key],
          new: newState[key],
        }
      }
    }

    return diff
  }

  // Notificar suscriptores
  private notifySubscribers(diff: any): void {
    for (const [key, subscribers] of this.state.subscriptions) {
      if (diff[key]) {
        const value = this.state.current[key]
        subscribers.forEach(callback => callback(value))
      }
    }
  }

  // Obtener estado actual
  getState(): any {
    return this.state.current
  }

  // Obtener parte específica del estado
  getStateSlice(key: string): any {
    return this.state.current[key]
  }

  // Suscribirse a cambios de estado
  subscribe(key: string, callback: (value: any) => void): () => void {
    if (!this.state.subscriptions.has(key)) {
      this.state.subscriptions.set(key, new Set())
    }

    this.state.subscriptions.get(key)!.add(callback)

    // Retornar función de desuscripción
    return () => {
      const subscribers = this.state.subscriptions.get(key)
      if (subscribers) {
        subscribers.delete(callback)
        if (subscribers.size === 0) {
          this.state.subscriptions.delete(key)
        }
      }
    }
  }

  // Crear selector memoizado
  createSelector<T>(key: string, selector: (state: any) => T): (state: any) => T {
    if (this.options.enableSelectors) {
      this.state.selectors.set(key, selector)
    }
    return selector
  }

  // Obtener valor usando selector
  select<T>(key: string, state?: any): T | undefined {
    const selector = this.state.selectors.get(key)
    if (selector) {
      return selector(state || this.state.current)
    }
    return undefined
  }

  // Viajar en el tiempo (deshacer/rehacer)
  timeTravel(direction: 'back' | 'forward'): boolean {
    if (!this.options.enableTimeTravel) return false

    if (direction === 'back' && this.state.history.length > 0) {
      const snapshot = this.state.history.pop()!
      this.state.current = snapshot.state
      return true
    }

    return false
  }

  // Obtener historial
  getHistory(): StateSnapshot[] {
    return [...this.state.history]
  }

  // Limpiar historial
  clearHistory(): void {
    this.state.history = []
  }

  // Obtener estadísticas
  getStats(): {
    historySize: number
    subscriptionCount: number
    selectorCount: number
  } {
    return {
      historySize: this.state.history.length,
      subscriptionCount: Array.from(this.state.subscriptions.values()).reduce(
        (total, set) => total + set.size, 0
      ),
      selectorCount: this.state.selectors.size,
    }
  }

  // Limpiar timers
  cleanup(): void {
    this.debounceTimers.forEach(timer => clearTimeout(timer))
    this.throttleTimers.forEach(timer => clearTimeout(timer))
    this.debounceTimers.clear()
    this.throttleTimers.clear()
  }
}

// Instancia global del servicio
export const stateOptimization = StateOptimizationService.getInstance()

// Hook para usar optimización de estado
export function useStateOptimization() {
  const [state, setState] = useState<any>(stateOptimization.getState())
  const [stats, setStats] = useState(stateOptimization.getStats())

  useEffect(() => {
    const unsubscribe = stateOptimization.subscribe('*', (newState) => {
      setState(newState)
      setStats(stateOptimization.getStats())
    })

    return unsubscribe
  }, [])

  const updateState = useCallback((action: string, newState: any, options?: { debounce?: boolean; throttle?: boolean }) => {
    stateOptimization.updateState(action, newState, options)
  }, [])

  const getStateSlice = useCallback((key: string) => {
    return stateOptimization.getStateSlice(key)
  }, [])

  const subscribe = useCallback((key: string, callback: (value: any) => void) => {
    return stateOptimization.subscribe(key, callback)
  }, [])

  const createSelector = useCallback(<T,>(key: string, selector: (state: any) => T) => {
    return stateOptimization.createSelector(key, selector)
  }, [])

  const select = useCallback(<T,>(key: string, state?: any) => {
    return stateOptimization.select<T>(key, state)
  }, [])

  const timeTravel = useCallback((direction: 'back' | 'forward') => {
    return stateOptimization.timeTravel(direction)
  }, [])

  const clearHistory = useCallback(() => {
    stateOptimization.clearHistory()
  }, [])

  const cleanup = useCallback(() => {
    stateOptimization.cleanup()
  }, [])

  return {
    state,
    stats,
    updateState,
    getStateSlice,
    subscribe,
    createSelector,
    select,
    timeTravel,
    clearHistory,
    cleanup,
  }
}

// Hook para selector memoizado
export function useOptimizedSelector<T>(
  key: string,
  selector: (state: any) => T,
  deps: any[] = []
): T {
  const [value, setValue] = useState<T>(() => selector(stateOptimization.getState()))

  useEffect(() => {
    const unsubscribe = stateOptimization.subscribe('*', (newState) => {
      const newValue = selector(newState)
      setValue(newValue)
    })

    return unsubscribe
  }, deps)

  return value
}

// Hook para estado con debounce
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue)
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return [debouncedValue, setValue]
}

// Hook para estado con throttle
export function useThrottledState<T>(
  initialValue: T,
  delay: number = 100
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue)
  const [throttledValue, setThrottledValue] = useState<T>(initialValue)
  const lastUpdate = useRef<number>(0)

  useEffect(() => {
    const now = Date.now()
    if (now - lastUpdate.current >= delay) {
      setThrottledValue(value)
      lastUpdate.current = now
    }
  }, [value, delay])

  return [throttledValue, setValue]
}
