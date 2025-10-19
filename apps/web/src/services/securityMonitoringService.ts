// Servicio de monitoreo de seguridad
export interface SecurityEvent {
  id: string
  type: 'authentication' | 'authorization' | 'data_access' | 'suspicious_activity' | 'vulnerability' | 'threat'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: Date
  userId?: string
  sessionId: string
  ipAddress?: string
  userAgent: string
  url: string
  context: Record<string, any>
  resolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
  threatLevel: number // 0-100
}

export interface SecurityThreat {
  id: string
  type: 'xss' | 'csrf' | 'injection' | 'brute_force' | 'data_breach' | 'malware' | 'phishing'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  detectedAt: Date
  source: string
  target: string
  indicators: string[]
  mitigation: string[]
  status: 'active' | 'investigating' | 'mitigated' | 'resolved'
}

export interface SecurityReport {
  id: string
  timestamp: Date
  summary: {
    totalEvents: number
    criticalEvents: number
    highEvents: number
    mediumEvents: number
    lowEvents: number
    activeThreats: number
    resolvedThreats: number
    securityScore: number
  }
  events: SecurityEvent[]
  threats: SecurityThreat[]
  trends: {
    last24h: number
    last7d: number
    last30d: number
  }
  recommendations: string[]
}

// Clase principal del servicio de monitoreo de seguridad
export class SecurityMonitoringService {
  private static instance: SecurityMonitoringService
  private securityEvents: SecurityEvent[] = []
  private securityThreats: SecurityThreat[] = []
  private isInitialized = false
  private sessionId: string
  private userId?: string

  private constructor() {
    this.sessionId = this.generateSessionId()
    this.userId = this.getUserId()
    this.initializeSecurityMonitoring()
  }

  static getInstance(): SecurityMonitoringService {
    if (!SecurityMonitoringService.instance) {
      SecurityMonitoringService.instance = new SecurityMonitoringService()
    }
    return SecurityMonitoringService.instance
  }

  // Inicializar monitoreo de seguridad
  private initializeSecurityMonitoring(): void {
    if (typeof window === 'undefined') return

    // Monitorear intentos de autenticación
    this.monitorAuthentication()

    // Monitorear acceso a datos sensibles
    this.monitorDataAccess()

    // Monitorear actividad sospechosa
    this.monitorSuspiciousActivity()

    // Monitorear vulnerabilidades
    this.monitorVulnerabilities()

    // Monitorear amenazas
    this.monitorThreats()

    this.isInitialized = true
  }

  // Monitorear autenticación
  private monitorAuthentication(): void {
    // Interceptar llamadas de autenticación
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const url = args[0] as string
      
      if (url.includes('/auth/login') || url.includes('/auth/register')) {
        this.captureSecurityEvent({
          type: 'authentication',
          severity: 'medium',
          message: `Authentication attempt to ${url}`,
          context: { url, method: 'POST' },
          threatLevel: 20,
        })
      }

      return originalFetch(...args)
    }
  }

  // Monitorear acceso a datos
  private monitorDataAccess(): void {
    // Interceptar acceso a datos sensibles
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const url = args[0] as string
      
      if (url.includes('/api/users') || url.includes('/api/admin')) {
        this.captureSecurityEvent({
          type: 'data_access',
          severity: 'medium',
          message: `Data access attempt to ${url}`,
          context: { url, method: 'GET' },
          threatLevel: 30,
        })
      }

      return originalFetch(...args)
    }
  }

  // Monitorear actividad sospechosa
  private monitorSuspiciousActivity(): void {
    // Detectar patrones sospechosos
    let rapidClicks = 0
    let lastClickTime = 0

    document.addEventListener('click', (event) => {
      const now = Date.now()
      if (now - lastClickTime < 100) { // Menos de 100ms entre clicks
        rapidClicks++
        if (rapidClicks > 10) {
          this.captureSecurityEvent({
            type: 'suspicious_activity',
            severity: 'high',
            message: 'Rapid clicking detected - possible bot activity',
            context: { rapidClicks, element: (event.target as Element).tagName },
            threatLevel: 70,
          })
          rapidClicks = 0
        }
      } else {
        rapidClicks = 0
      }
      lastClickTime = now
    })

    // Detectar intentos de inyección
    document.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement
      const value = target.value

      if (this.detectInjectionAttempt(value)) {
        this.captureSecurityEvent({
          type: 'suspicious_activity',
          severity: 'high',
          message: 'Potential injection attempt detected',
          context: { input: target.name, value: value.substring(0, 100) },
          threatLevel: 80,
        })
      }
    })
  }

  // Monitorear vulnerabilidades
  private monitorVulnerabilities(): void {
    // Detectar XSS
    this.detectXSS()

    // Detectar CSRF
    this.detectCSRF()

    // Detectar vulnerabilidades de contenido
    this.detectContentVulnerabilities()
  }

  // Monitorear amenazas
  private monitorThreats(): void {
    // Detectar malware
    this.detectMalware()

    // Detectar phishing
    this.detectPhishing()

    // Detectar ataques de fuerza bruta
    this.detectBruteForce()
  }

  // Detectar intentos de inyección
  private detectInjectionAttempt(value: string): boolean {
    const injectionPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /union\s+select/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /insert\s+into/i,
      /update\s+set/i,
    ]

    return injectionPatterns.some(pattern => pattern.test(value))
  }

  // Detectar XSS
  private detectXSS(): void {
    // Monitorear cambios en el DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              if (element.innerHTML.includes('<script') || element.innerHTML.includes('javascript:')) {
                this.captureSecurityEvent({
                  type: 'vulnerability',
                  severity: 'critical',
                  message: 'Potential XSS vulnerability detected',
                  context: { element: element.tagName, content: element.innerHTML.substring(0, 100) },
                  threatLevel: 90,
                })
              }
            }
          })
        }
      })
    })

    observer.observe(document.body, { childList: true, subtree: true })
  }

  // Detectar CSRF
  private detectCSRF(): void {
    // Verificar tokens CSRF
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const url = args[0] as string
      const options = args[1] as RequestInit

      if (options?.method && ['POST', 'PUT', 'DELETE'].includes(options.method.toUpperCase())) {
        const hasCSRFToken = document.querySelector('meta[name="csrf-token"]')
        if (!hasCSRFToken) {
          this.captureSecurityEvent({
            type: 'vulnerability',
            severity: 'high',
            message: 'CSRF token missing for state-changing request',
            context: { url, method: options.method },
            threatLevel: 60,
          })
        }
      }

      return originalFetch(...args)
    }
  }

  // Detectar vulnerabilidades de contenido
  private detectContentVulnerabilities(): void {
    // Verificar políticas de contenido
    const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
    if (!csp) {
      this.captureSecurityEvent({
        type: 'vulnerability',
        severity: 'medium',
        message: 'Content Security Policy not implemented',
        context: { vulnerability: 'missing_csp' },
        threatLevel: 40,
      })
    }

    // Verificar HTTPS
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      this.captureSecurityEvent({
        type: 'vulnerability',
        severity: 'high',
        message: 'Application not using HTTPS',
        context: { protocol: location.protocol },
        threatLevel: 70,
      })
    }
  }

  // Detectar malware
  private detectMalware(): void {
    // Simular detección de malware
    // En producción, esto se integraría con servicios de seguridad
    console.log('Malware detection initialized')
  }

  // Detectar phishing
  private detectPhishing(): void {
    // Verificar URLs sospechosas
    const suspiciousDomains = ['phishing-site.com', 'fake-bank.com']
    const currentDomain = location.hostname

    if (suspiciousDomains.some(domain => currentDomain.includes(domain))) {
      this.captureSecurityEvent({
        type: 'threat',
        severity: 'critical',
        message: 'Potential phishing site detected',
        context: { domain: currentDomain },
        threatLevel: 95,
      })
    }
  }

  // Detectar ataques de fuerza bruta
  private detectBruteForce(): void {
    let failedAttempts = 0
    let lastAttemptTime = 0

    // Monitorear intentos fallidos de autenticación
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const url = args[0] as string
      
      if (url.includes('/auth/login')) {
        try {
          const response = await originalFetch(...args)
          if (!response.ok && response.status === 401) {
            failedAttempts++
            lastAttemptTime = Date.now()

            if (failedAttempts > 5) {
              this.captureSecurityEvent({
                type: 'threat',
                severity: 'high',
                message: 'Potential brute force attack detected',
                context: { failedAttempts, timeWindow: '5 minutes' },
                threatLevel: 75,
              })
            }
          } else {
            failedAttempts = 0
          }
          return response
        } catch (error) {
          return originalFetch(...args)
        }
      }

      return originalFetch(...args)
    }
  }

  // Capturar evento de seguridad
  captureSecurityEvent(eventData: {
    type: SecurityEvent['type']
    severity: SecurityEvent['severity']
    message: string
    context: Record<string, any>
    threatLevel: number
  }): void {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      type: eventData.type,
      severity: eventData.severity,
      message: eventData.message,
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
      ipAddress: this.getIPAddress(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context: eventData.context,
      resolved: false,
      threatLevel: eventData.threatLevel,
    }

    this.securityEvents.push(event)

    // Enviar a servidor (en producción)
    this.sendSecurityEventToServer(event)

    // Crear amenaza si es crítica
    if (eventData.severity === 'critical' || eventData.threatLevel > 80) {
      this.createSecurityThreat(event)
    }
  }

  // Crear amenaza de seguridad
  private createSecurityThreat(event: SecurityEvent): void {
    const threat: SecurityThreat = {
      id: this.generateThreatId(),
      type: this.determineThreatType(event),
      description: event.message,
      severity: event.severity,
      detectedAt: new Date(),
      source: event.ipAddress || 'unknown',
      target: event.url,
      indicators: [event.message],
      mitigation: this.generateMitigation(event),
      status: 'active',
    }

    this.securityThreats.push(threat)
  }

  // Determinar tipo de amenaza
  private determineThreatType(event: SecurityEvent): SecurityThreat['type'] {
    if (event.message.includes('XSS') || event.message.includes('script')) {
      return 'xss'
    }
    if (event.message.includes('CSRF') || event.message.includes('token')) {
      return 'csrf'
    }
    if (event.message.includes('injection') || event.message.includes('SQL')) {
      return 'injection'
    }
    if (event.message.includes('brute force') || event.message.includes('rapid')) {
      return 'brute_force'
    }
    if (event.message.includes('phishing')) {
      return 'phishing'
    }
    return 'malware'
  }

  // Generar mitigación
  private generateMitigation(event: SecurityEvent): string[] {
    const mitigations: string[] = []

    switch (event.type) {
      case 'authentication':
        mitigations.push('Implement rate limiting')
        mitigations.push('Add CAPTCHA for suspicious activity')
        break
      case 'data_access':
        mitigations.push('Review access permissions')
        mitigations.push('Implement data encryption')
        break
      case 'suspicious_activity':
        mitigations.push('Block suspicious IP addresses')
        mitigations.push('Implement behavioral analysis')
        break
      case 'vulnerability':
        mitigations.push('Apply security patches')
        mitigations.push('Update security policies')
        break
      case 'threat':
        mitigations.push('Activate incident response')
        mitigations.push('Notify security team')
        break
    }

    return mitigations
  }

  // Generar ID de evento
  private generateEventId(): string {
    return `security_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Generar ID de amenaza
  private generateThreatId(): string {
    return `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Generar ID de sesión
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Obtener ID de usuario
  private getUserId(): string | undefined {
    return localStorage.getItem('userId') || undefined
  }

  // Obtener dirección IP
  private getIPAddress(): string | undefined {
    // En producción, esto se obtendría del servidor
    return undefined
  }

  // Enviar evento de seguridad al servidor
  private sendSecurityEventToServer(event: SecurityEvent): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('Security event sent to server:', event)
    }
    // En producción, esto enviaría el evento a un servicio de seguridad
  }

  // Obtener eventos por severidad
  getEventsBySeverity(severity: SecurityEvent['severity']): SecurityEvent[] {
    return this.securityEvents.filter(event => event.severity === severity)
  }

  // Obtener amenazas activas
  getActiveThreats(): SecurityThreat[] {
    return this.securityThreats.filter(threat => threat.status === 'active')
  }

  // Resolver evento de seguridad
  resolveSecurityEvent(eventId: string, resolvedBy: string): void {
    const event = this.securityEvents.find(e => e.id === eventId)
    if (event) {
      event.resolved = true
      event.resolvedAt = new Date()
      event.resolvedBy = resolvedBy
    }
  }

  // Mitigar amenaza
  mitigateThreat(threatId: string, mitigation: string): void {
    const threat = this.securityThreats.find(t => t.id === threatId)
    if (threat) {
      threat.status = 'mitigated'
      threat.mitigation.push(mitigation)
    }
  }

  // Generar reporte de seguridad
  generateSecurityReport(): SecurityReport {
    const now = Date.now()
    const last24h = now - (24 * 60 * 60 * 1000)
    const last7d = now - (7 * 24 * 60 * 60 * 1000)
    const last30d = now - (30 * 24 * 60 * 60 * 1000)

    const summary = {
      totalEvents: this.securityEvents.length,
      criticalEvents: this.securityEvents.filter(e => e.severity === 'critical').length,
      highEvents: this.securityEvents.filter(e => e.severity === 'high').length,
      mediumEvents: this.securityEvents.filter(e => e.severity === 'medium').length,
      lowEvents: this.securityEvents.filter(e => e.severity === 'low').length,
      activeThreats: this.securityThreats.filter(t => t.status === 'active').length,
      resolvedThreats: this.securityThreats.filter(t => t.status === 'resolved').length,
      securityScore: this.calculateSecurityScore(),
    }

    const trends = {
      last24h: this.securityEvents.filter(e => e.timestamp.getTime() > last24h).length,
      last7d: this.securityEvents.filter(e => e.timestamp.getTime() > last7d).length,
      last30d: this.securityEvents.filter(e => e.timestamp.getTime() > last30d).length,
    }

    const recommendations = this.generateSecurityRecommendations()

    return {
      id: `security_report_${Date.now()}`,
      timestamp: new Date(),
      summary,
      events: [...this.securityEvents],
      threats: [...this.securityThreats],
      trends,
      recommendations,
    }
  }

  // Calcular puntuación de seguridad
  private calculateSecurityScore(): number {
    const totalEvents = this.securityEvents.length
    if (totalEvents === 0) return 100

    const criticalEvents = this.securityEvents.filter(e => e.severity === 'critical').length
    const highEvents = this.securityEvents.filter(e => e.severity === 'high').length
    const mediumEvents = this.securityEvents.filter(e => e.severity === 'medium').length
    const lowEvents = this.securityEvents.filter(e => e.severity === 'low').length

    const score = 100 - (criticalEvents * 20) - (highEvents * 10) - (mediumEvents * 5) - (lowEvents * 1)
    return Math.max(0, score)
  }

  // Generar recomendaciones de seguridad
  private generateSecurityRecommendations(): string[] {
    const recommendations: string[] = []

    const criticalEvents = this.securityEvents.filter(e => e.severity === 'critical')
    if (criticalEvents.length > 0) {
      recommendations.push(`${criticalEvents.length} eventos críticos requieren atención inmediata`)
    }

    const activeThreats = this.securityThreats.filter(t => t.status === 'active')
    if (activeThreats.length > 0) {
      recommendations.push(`${activeThreats.length} amenazas activas detectadas`)
    }

    const unresolvedEvents = this.securityEvents.filter(e => !e.resolved)
    if (unresolvedEvents.length > 10) {
      recommendations.push(`${unresolvedEvents.length} eventos de seguridad sin resolver`)
    }

    const securityScore = this.calculateSecurityScore()
    if (securityScore < 70) {
      recommendations.push('Puntuación de seguridad baja - implementar medidas de seguridad adicionales')
    }

    return recommendations
  }

  // Obtener todos los eventos
  getAllEvents(): SecurityEvent[] {
    return [...this.securityEvents]
  }

  // Obtener todas las amenazas
  getAllThreats(): SecurityThreat[] {
    return [...this.securityThreats]
  }

  // Limpiar datos
  clearData(): void {
    this.securityEvents = []
    this.securityThreats = []
  }

  // Exportar datos
  exportData(): string {
    return JSON.stringify({
      events: this.securityEvents,
      threats: this.securityThreats,
      report: this.generateSecurityReport(),
    }, null, 2)
  }
}

// Instancia global del servicio
export const securityMonitoringService = SecurityMonitoringService.getInstance()

// Hook para usar el servicio de monitoreo de seguridad
export function useSecurityMonitoring() {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [threats, setThreats] = useState<SecurityThreat[]>([])
  const [report, setReport] = useState<SecurityReport | null>(null)

  useEffect(() => {
    setEvents(securityMonitoringService.getAllEvents())
    setThreats(securityMonitoringService.getAllThreats())
    setReport(securityMonitoringService.generateSecurityReport())
  }, [])

  const captureSecurityEvent = useCallback((eventData: {
    type: SecurityEvent['type']
    severity: SecurityEvent['severity']
    message: string
    context: Record<string, any>
    threatLevel: number
  }) => {
    securityMonitoringService.captureSecurityEvent(eventData)
    setEvents(securityMonitoringService.getAllEvents())
    setThreats(securityMonitoringService.getAllThreats())
    setReport(securityMonitoringService.generateSecurityReport())
  }, [])

  const resolveSecurityEvent = useCallback((eventId: string, resolvedBy: string) => {
    securityMonitoringService.resolveSecurityEvent(eventId, resolvedBy)
    setEvents(securityMonitoringService.getAllEvents())
    setReport(securityMonitoringService.generateSecurityReport())
  }, [])

  const mitigateThreat = useCallback((threatId: string, mitigation: string) => {
    securityMonitoringService.mitigateThreat(threatId, mitigation)
    setThreats(securityMonitoringService.getAllThreats())
    setReport(securityMonitoringService.generateSecurityReport())
  }, [])

  const getEventsBySeverity = useCallback((severity: SecurityEvent['severity']) => {
    return securityMonitoringService.getEventsBySeverity(severity)
  }, [])

  const getActiveThreats = useCallback(() => {
    return securityMonitoringService.getActiveThreats()
  }, [])

  const generateSecurityReport = useCallback(() => {
    const newReport = securityMonitoringService.generateSecurityReport()
    setReport(newReport)
    return newReport
  }, [])

  const clearData = useCallback(() => {
    securityMonitoringService.clearData()
    setEvents([])
    setThreats([])
    setReport(null)
  }, [])

  const exportData = useCallback(() => {
    return securityMonitoringService.exportData()
  }, [])

  return {
    events,
    threats,
    report,
    captureSecurityEvent,
    resolveSecurityEvent,
    mitigateThreat,
    getEventsBySeverity,
    getActiveThreats,
    generateSecurityReport,
    clearData,
    exportData,
  }
}

// Componente de dashboard de monitoreo de seguridad
interface SecurityMonitoringDashboardProps {
  className?: string
}

export const SecurityMonitoringDashboard: React.FC<SecurityMonitoringDashboardProps> = ({ className = '' }) => {
  const { events, threats, report, resolveSecurityEvent, mitigateThreat, generateSecurityReport, clearData, exportData } = useSecurityMonitoring()

  const getSeverityColor = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getThreatStatusColor = (status: SecurityThreat['status']) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-100'
      case 'investigating': return 'text-yellow-600 bg-yellow-100'
      case 'mitigated': return 'text-blue-600 bg-blue-100'
      case 'resolved': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Dashboard de Monitoreo de Seguridad</h2>
        <div className="space-x-2">
          <button
            onClick={generateSecurityReport}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Generar Reporte
          </button>
          <button
            onClick={clearData}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Limpiar Datos
          </button>
          <button
            onClick={() => {
              const data = exportData()
              const blob = new Blob([data], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'security-monitoring-data.json'
              a.click()
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Exportar Datos
          </button>
        </div>
      </div>

      {report && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Resumen de Seguridad</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Puntuación de Seguridad</h4>
              <p className="text-2xl font-bold text-gray-800">{report.summary.securityScore}/100</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Eventos Críticos</h4>
              <p className="text-2xl font-bold text-red-600">{report.summary.criticalEvents}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Amenazas Activas</h4>
              <p className="text-2xl font-bold text-orange-600">{report.summary.activeThreats}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Total de Eventos</h4>
              <p className="text-2xl font-bold text-gray-800">{report.summary.totalEvents}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Eventos de Seguridad Recientes</h3>
          <div className="space-y-2">
            {events.slice(-5).map(event => (
              <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{event.message}</h4>
                    <p className="text-xs text-gray-600">{event.timestamp.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                      {event.severity}
                    </span>
                    {!event.resolved && (
                      <button
                        onClick={() => resolveSecurityEvent(event.id, 'user')}
                        className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Resolver
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500">{event.type} • Nivel de amenaza: {event.threatLevel}/100</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Amenazas de Seguridad</h3>
          <div className="space-y-2">
            {threats.slice(-5).map(threat => (
              <div key={threat.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{threat.description}</h4>
                    <p className="text-xs text-gray-600">{threat.detectedAt.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getThreatStatusColor(threat.status)}`}>
                      {threat.status}
                    </span>
                    {threat.status === 'active' && (
                      <button
                        onClick={() => mitigateThreat(threat.id, 'Mitigated by user')}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Mitigar
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500">{threat.type} • {threat.source} → {threat.target}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
