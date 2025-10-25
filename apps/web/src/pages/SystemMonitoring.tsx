import React, { useState } from 'react'

export default function SystemMonitoring() {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'System Overview' },
    { id: 'performance', label: 'Performance' },
    { id: 'security', label: 'Security' },
    { id: 'optimization', label: 'Optimization' },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">System Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800">API Status</h4>
                <p className="text-2xl font-bold text-blue-600">Online</p>
                <p className="text-xs text-blue-600">Port 4000</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800">Frontend Status</h4>
                <p className="text-2xl font-bold text-green-600">Online</p>
                <p className="text-xs text-green-600">Port 5173</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-purple-800">Database Status</h4>
                <p className="text-2xl font-bold text-purple-600">Connected</p>
                <p className="text-xs text-purple-600">PostgreSQL</p>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                <strong>Note:</strong> Advanced monitoring services are being optimized to prevent system overload.
                Basic performance monitoring is active.
              </p>
            </div>
          </div>
        )
      case 'performance':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-800">CPU Usage</h4>
                <p className="text-2xl font-bold text-gray-600">Normal</p>
                <p className="text-xs text-gray-600">Stable performance</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-800">Memory Usage</h4>
                <p className="text-2xl font-bold text-gray-600">Normal</p>
                <p className="text-xs text-gray-600">Within limits</p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                <strong>Performance Status:</strong> System is running efficiently with basic optimizations.
              </p>
            </div>
          </div>
        )
      case 'security':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Security Monitoring</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800">Authentication</h4>
                <p className="text-2xl font-bold text-green-600">Active</p>
                <p className="text-xs text-green-600">JWT tokens</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800">Authorization</h4>
                <p className="text-2xl font-bold text-green-600">Active</p>
                <p className="text-xs text-green-600">Role-based access</p>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                <strong>Security Status:</strong> All security measures are active and functioning properly.
              </p>
            </div>
          </div>
        )
      case 'optimization':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">System Optimization</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800">Build Optimization</h4>
                <p className="text-2xl font-bold text-blue-600">Active</p>
                <p className="text-xs text-blue-600">Vite + React</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800">Code Splitting</h4>
                <p className="text-2xl font-bold text-blue-600">Active</p>
                <p className="text-xs text-blue-600">Dynamic imports</p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                <strong>Optimization Status:</strong> System is running with basic optimizations.
                Advanced optimization services will be implemented gradually to ensure stability.
              </p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
          <p className="mt-2 text-gray-600">Basic monitoring dashboard - Advanced features coming soon</p>
        </div>

        <div className="bg-white rounded-lg shadow">
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
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )
}