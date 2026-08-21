import React, { useState, useEffect, useCallback } from 'react'

// Servicio de analytics y métricas avanzadas
export interface AnalyticsEvent {
  id: string
  type: string
  category: string
  action: string
  label?: string
  value?: number
  timestamp: Date
  userId?: string
  sessionId: string
  metadata?: Record<string, any>
}

export interface UserSession {
  id: string
  userId?: string
  startTime: Date
  endTime?: Date
  duration?: number
  pageViews: number
  events: AnalyticsEvent[]
  device: {
    userAgent: string
    screen: { width: number; height: number }
    viewport: { width: number; height: number }
    language: string
    timezone: string
  }
  location?: {
    country: string
    region: string
    city: string
  }
}

export interface PerformanceMetrics {
  pageLoadTime: number
  domContentLoaded: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  firstInputDelay: number
  cumulativeLayoutShift: number
  timeToInteractive: number
  totalBlockingTime: number
}

export interface UserBehavior {
  clicks: number
  scrolls: number
  keystrokes: number
  formSubmissions: number
  errors: number
  timeOnPage: number
  bounceRate: number
}

// Clase principal del servicio de analytics
export class AnalyticsService {
  private static instance: AnalyticsService
  private events: AnalyticsEvent[] = []
  private currentSession: UserSession | null = null
  private performanceObserver: PerformanceObserver | null = null
  private isInitialized = false

  private constructor() {
    this.initializeSession()
    this.setupPerformanceObserver()
    this.setupEventListeners()
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  // Inicializar sesión de usuario
  private initializeSession(): void {
    const sessionId = this.generateSessionId()
    const userId = this.getUserId()

    this.currentSession = {
      id: sessionId,
      userId,
      startTime: new Date(),
      pageViews: 0,
      events: [],
      device: this.getDeviceInfo(),
      location: this.getLocationInfo(),
    }

    this.isInitialized = true
  }

  // Configurar observador de rendimiento
  private setupPerformanceObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          this.trackPerformanceEvent(entry)
        })
      })

      // Observar diferentes tipos de métricas
      this.performanceObserver.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] })
    } catch (error) {
      console.warn('Performance Observer not supported:', error)
    }
  }

  // Configurar listeners de eventos
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return

    // Click tracking
    document.addEventListener('click', (event) => {
      this.trackEvent('interaction', 'click', JSON.stringify(this.getElementInfo(event.target as Element)))
    })

    // Scroll tracking
    let scrollTimeout: NodeJS.Timeout
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        this.trackEvent('interaction', 'scroll', JSON.stringify({ scrollY: window.scrollY }))
      }, 100)
    })

    // Form submission tracking
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement
      this.trackEvent('form', 'submit', JSON.stringify({ formId: form.id, formClass: form.className }))
    })

    // Error tracking
    window.addEventListener('error', (event) => {
      this.trackEvent('error', 'javascript', JSON.stringify({ message: event.message, filename: event.filename, lineno: event.lineno, colno: event.colno }))
    })

    // Page visibility tracking
    document.addEventListener('visibilitychange', () => {
      this.trackEvent('page', 'visibility_change', JSON.stringify({ visible: !document.hidden }))
    })

    // Before unload tracking
    window.addEventListener('beforeunload', () => {
      this.endSession()
    })
  }

  // Rastrear evento personalizado
  trackEvent(category: string, action: string, label?: string, value?: number, metadata?: Record<string, any>): void {
    if (!this.isInitialized || !this.currentSession) return

    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      type: 'custom',
      category,
      action,
      label,
      value,
      timestamp: new Date(),
      userId: this.currentSession.userId,
      sessionId: this.currentSession.id,
      metadata,
    }

    this.events.push(event)
    this.currentSession.events.push(event)

    // Enviar a servidor (en producción)
    this.sendEventToServer(event)
  }

  // Rastrear vista de página
  trackPageView(page: string, title?: string): void {
    if (!this.currentSession) return

    this.currentSession.pageViews++
    this.trackEvent('page', 'view', page, undefined, { title })
  }

  // Rastrear evento de rendimiento
  private trackPerformanceEvent(entry: PerformanceEntry): void {
    const metadata: Record<string, any> = {
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime,
    }

    switch (entry.entryType) {
      case 'navigation':
        this.trackEvent('performance', 'navigation', entry.name, entry.duration, metadata)
        break
      case 'paint':
        this.trackEvent('performance', 'paint', entry.name, entry.duration, metadata)
        break
      case 'largest-contentful-paint':
        this.trackEvent('performance', 'lcp', entry.name, entry.duration, metadata)
        break
      case 'first-input':
        this.trackEvent('performance', 'fid', entry.name, entry.duration, metadata)
        break
      case 'layout-shift':
        this.trackEvent('performance', 'cls', entry.name, (entry as any).value, metadata)
        break
    }
  }

  // Obtener métricas de rendimiento
  getPerformanceMetrics(): PerformanceMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')
    const lcp = performance.getEntriesByType('largest-contentful-paint')
    const fid = performance.getEntriesByType('first-input')
    const cls = performance.getEntriesByType('layout-shift')

    return {
      pageLoadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      largestContentfulPaint: lcp.length > 0 ? lcp[lcp.length - 1].startTime : 0,
      firstInputDelay: fid.length > 0 ? (fid[0] as any).processingStart - fid[0].startTime : 0,
      cumulativeLayoutShift: cls.reduce((sum, entry) => sum + (entry as any).value, 0),
      timeToInteractive: this.calculateTimeToInteractive(),
      totalBlockingTime: this.calculateTotalBlockingTime(),
    }
  }

  // Obtener comportamiento del usuario
  getUserBehavior(): UserBehavior {
    const session = this.currentSession
    if (!session) return this.getDefaultUserBehavior()

    const clicks = session.events.filter(e => e.action === 'click').length
    const scrolls = session.events.filter(e => e.action === 'scroll').length
    const formSubmissions = session.events.filter(e => e.action === 'submit').length
    const errors = session.events.filter(e => e.category === 'error').length
    const timeOnPage = session.endTime ? session.endTime.getTime() - session.startTime.getTime() : Date.now() - session.startTime.getTime()

    return {
      clicks,
      scrolls,
      keystrokes: 0, // Se implementaría con listeners específicos
      formSubmissions,
      errors,
      timeOnPage,
      bounceRate: session.pageViews <= 1 ? 1 : 0,
    }
  }

  // Obtener sesión actual
  getCurrentSession(): UserSession | null {
    return this.currentSession
  }

  // Obtener todos los eventos
  getAllEvents(): AnalyticsEvent[] {
    return [...this.events]
  }

  // Finalizar sesión
  endSession(): void {
    if (!this.currentSession) return

    this.currentSession.endTime = new Date()
    this.currentSession.duration = this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime()

    // Enviar sesión completa al servidor
    this.sendSessionToServer(this.currentSession)
  }

  // Generar ID de sesión
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Generar ID de evento
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Obtener ID de usuario
  private getUserId(): string | undefined {
    // En producción, esto vendría del sistema de autenticación
    return localStorage.getItem('userId') || undefined
  }

  // Obtener información del dispositivo
  private getDeviceInfo(): UserSession['device'] {
    return {
      userAgent: navigator.userAgent,
      screen: { width: screen.width, height: screen.height },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
  }

  // Obtener información de ubicación
  private getLocationInfo(): UserSession['location'] | undefined {
    // En producción, esto se haría con una API de geolocalización
    return undefined
  }

  // Obtener información del elemento
  private getElementInfo(element: Element): Record<string, any> {
    return {
      tagName: element.tagName,
      id: element.id,
      className: element.className,
      textContent: element.textContent?.substring(0, 100),
    }
  }

  // Calcular tiempo hasta interactividad
  private calculateTimeToInteractive(): number {
    // Implementación simplificada
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0
  }

  // Calcular tiempo total de bloqueo
  private calculateTotalBlockingTime(): number {
    // Implementación simplificada
    return 0
  }

  // Obtener comportamiento por defecto
  private getDefaultUserBehavior(): UserBehavior {
    return {
      clicks: 0,
      scrolls: 0,
      keystrokes: 0,
      formSubmissions: 0,
      errors: 0,
      timeOnPage: 0,
      bounceRate: 0,
    }
  }

  // Enviar evento al servidor
  private sendEventToServer(event: AnalyticsEvent): void {
    // En producción, esto enviaría los datos a un servidor de analytics
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event)
    }
  }

  // Enviar sesión al servidor
  private sendSessionToServer(session: UserSession): void {
    // En producción, esto enviaría la sesión completa al servidor
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Session:', session)
    }
  }

  // Limpiar datos
  clearData(): void {
    this.events = []
    this.currentSession = null
    this.initializeSession()
  }

  // Exportar datos
  exportData(): string {
    return JSON.stringify({
      events: this.events,
      session: this.currentSession,
      performance: this.getPerformanceMetrics(),
      behavior: this.getUserBehavior(),
    }, null, 2)
  }
}

// Instancia global del servicio
export const analyticsService = AnalyticsService.getInstance()

// Hook para usar analytics
export function useAnalytics() {
  const [session, setSession] = useState<UserSession | null>(null)
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null)
  const [behavior, setBehavior] = useState<UserBehavior | null>(null)

  useEffect(() => {
    setSession(analyticsService.getCurrentSession())
    setPerformance(analyticsService.getPerformanceMetrics())
    setBehavior(analyticsService.getUserBehavior())

    const interval = setInterval(() => {
      setPerformance(analyticsService.getPerformanceMetrics())
      setBehavior(analyticsService.getUserBehavior())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const trackEvent = useCallback((category: string, action: string, label?: string, value?: number, metadata?: Record<string, any>) => {
    analyticsService.trackEvent(category, action, label, value, metadata)
  }, [])

  const trackPageView = useCallback((page: string, title?: string) => {
    analyticsService.trackPageView(page, title)
  }, [])

  const getPerformanceMetrics = useCallback(() => {
    return analyticsService.getPerformanceMetrics()
  }, [])

  const getUserBehavior = useCallback(() => {
    return analyticsService.getUserBehavior()
  }, [])

  const exportData = useCallback(() => {
    return analyticsService.exportData()
  }, [])

  const clearData = useCallback(() => {
    analyticsService.clearData()
    setSession(null)
    setPerformance(null)
    setBehavior(null)
  }, [])

  return {
    session,
    performance,
    behavior,
    trackEvent,
    trackPageView,
    getPerformanceMetrics,
    getUserBehavior,
    exportData,
    clearData,
  }
}

// Componente de dashboard de analytics
interface AnalyticsDashboardProps {
  className?: string
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className = '' }) => {
  const { session, performance, behavior, trackEvent, exportData, clearData } = useAnalytics()

  const formatTime = (ms: number) => {
    return `${ms.toFixed(0)}ms`
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Dashboard de Analytics</h2>
        <div className="space-x-2">
          <button
            onClick={() => trackEvent('dashboard', 'export')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Exportar Datos
          </button>
          <button
            onClick={clearData}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Limpiar Datos
          </button>
        </div>
      </div>

      {session && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Sesión Actual</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">ID de Sesión</h4>
              <p className="text-sm text-gray-800 font-mono">{session.id}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Vistas de Página</h4>
              <p className="text-2xl font-bold text-gray-800">{session.pageViews}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Eventos</h4>
              <p className="text-2xl font-bold text-gray-800">{session.events.length}</p>
            </div>
          </div>
        </div>
      )}

      {performance && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Métricas de Rendimiento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Tiempo de Carga</h4>
              <p className="text-2xl font-bold text-gray-800">{formatTime(performance.pageLoadTime)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">First Contentful Paint</h4>
              <p className="text-2xl font-bold text-gray-800">{formatTime(performance.firstContentfulPaint)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Largest Contentful Paint</h4>
              <p className="text-2xl font-bold text-gray-800">{formatTime(performance.largestContentfulPaint)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">First Input Delay</h4>
              <p className="text-2xl font-bold text-gray-800">{formatTime(performance.firstInputDelay)}</p>
            </div>
          </div>
        </div>
      )}

      {behavior && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Comportamiento del Usuario</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Clicks</h4>
              <p className="text-2xl font-bold text-gray-800">{behavior.clicks}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Scrolls</h4>
              <p className="text-2xl font-bold text-gray-800">{behavior.scrolls}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Formularios</h4>
              <p className="text-2xl font-bold text-gray-800">{behavior.formSubmissions}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Errores</h4>
              <p className="text-2xl font-bold text-gray-800">{behavior.errors}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
