import React, { useState } from 'react'
import { 
  AnalyticsDashboard, 
  TestingDashboard, 
  DocumentationDashboard, 
  ErrorMonitoringDashboard, 
  SecurityMonitoringDashboard, 
  CodeQualityDashboard, 
  AccessibilityDashboard, 
  SEOMonitoringDashboard, 
  UsabilityMonitoringDashboard, 
  NetworkPerformanceDashboard, 
  DatabasePerformanceDashboard, 
  MemoryPerformanceDashboard, 
  CPUPerformanceDashboard, 
  DiskPerformanceDashboard,
  AutomationDashboard,
  IntelligentCacheDashboard,
  AssetOptimizationDashboard,
  PreloadingDashboard,
  QueryOptimizationDashboard,
  CompressionDashboard,
  StateOptimizationDashboard
} from '../services'

export default function SystemMonitoring() {
  const [activeTab, setActiveTab] = useState('analytics')

  const tabs = [
    { id: 'analytics', label: 'Analytics', component: AnalyticsDashboard },
    { id: 'testing', label: 'Testing', component: TestingDashboard },
    { id: 'documentation', label: 'Documentation', component: DocumentationDashboard },
    { id: 'error-monitoring', label: 'Error Monitoring', component: ErrorMonitoringDashboard },
    { id: 'security', label: 'Security', component: SecurityMonitoringDashboard },
    { id: 'code-quality', label: 'Code Quality', component: CodeQualityDashboard },
    { id: 'accessibility', label: 'Accessibility', component: AccessibilityDashboard },
    { id: 'seo', label: 'SEO', component: SEOMonitoringDashboard },
    { id: 'usability', label: 'Usability', component: UsabilityMonitoringDashboard },
    { id: 'network-performance', label: 'Network Performance', component: NetworkPerformanceDashboard },
    { id: 'database-performance', label: 'Database Performance', component: DatabasePerformanceDashboard },
    { id: 'memory-performance', label: 'Memory Performance', component: MemoryPerformanceDashboard },
    { id: 'cpu-performance', label: 'CPU Performance', component: CPUPerformanceDashboard },
    { id: 'disk-performance', label: 'Disk Performance', component: DiskPerformanceDashboard },
    { id: 'automation', label: 'Automation', component: AutomationDashboard },
    { id: 'intelligent-cache', label: 'Intelligent Cache', component: IntelligentCacheDashboard },
    { id: 'asset-optimization', label: 'Asset Optimization', component: AssetOptimizationDashboard },
    { id: 'preloading', label: 'Preloading', component: PreloadingDashboard },
    { id: 'query-optimization', label: 'Query Optimization', component: QueryOptimizationDashboard },
    { id: 'compression', label: 'Compression', component: CompressionDashboard },
    { id: 'state-optimization', label: 'State Optimization', component: StateOptimizationDashboard },
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Comprehensive monitoring and analytics for your application
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {ActiveComponent && <ActiveComponent />}
          </div>
        </div>
      </div>
    </div>
  )
}
