import React, { useState, ReactNode } from 'react'

interface TabItem {
  id: string
  label: string
  content: ReactNode
  disabled?: boolean
  icon?: string
  badge?: string | number
}

interface TabsProps {
  tabs: TabItem[]
  defaultTab?: string
  variant?: 'default' | 'pills' | 'underline' | 'cards'
  size?: 'sm' | 'md' | 'lg'
  orientation?: 'horizontal' | 'vertical'
  fullWidth?: boolean
  className?: string
  onTabChange?: (tabId: string) => void
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  variant = 'default',
  size = 'md',
  orientation = 'horizontal',
  fullWidth = false,
  className = '',
  onTabChange
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const handleTabClick = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (tab && !tab.disabled) {
      setActiveTab(tabId)
      onTabChange?.(tabId)
    }
  }

  const sizeClasses = {
    sm: 'text-sm px-3 py-2',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3'
  }

  const variantClasses = {
    default: {
      tab: 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
      active: 'border-indigo-500 text-indigo-600',
      disabled: 'text-gray-400 cursor-not-allowed'
    },
    pills: {
      tab: 'rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100',
      active: 'bg-indigo-100 text-indigo-700',
      disabled: 'text-gray-400 cursor-not-allowed'
    },
    underline: {
      tab: 'border-b border-transparent text-gray-500 hover:text-gray-700',
      active: 'border-indigo-500 text-indigo-600',
      disabled: 'text-gray-400 cursor-not-allowed'
    },
    cards: {
      tab: 'border border-gray-200 rounded-t-lg text-gray-500 hover:text-gray-700 hover:border-gray-300',
      active: 'border-b-0 bg-white text-indigo-600',
      disabled: 'text-gray-400 cursor-not-allowed border-gray-100'
    }
  }

  const orientationClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col'
  }

  const containerClasses = orientation === 'horizontal' ? 'flex flex-col' : 'flex'
  const tabsClasses = `flex ${orientationClasses[orientation]} ${fullWidth ? 'w-full' : ''}`
  const contentClasses = orientation === 'horizontal' ? 'mt-4' : 'ml-4 flex-1'

  const currentVariant = variantClasses[variant]

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className={tabsClasses}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const isDisabled = tab.disabled
          
          const tabClasses = [
            'flex items-center justify-center font-medium transition-colors',
            sizeClasses[size],
            isActive ? currentVariant.active : currentVariant.tab,
            isDisabled ? currentVariant.disabled : '',
            fullWidth ? 'flex-1' : ''
          ].filter(Boolean).join(' ')

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              disabled={isDisabled}
              className={tabClasses}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
            >
              {tab.icon && <span className="mr-2">{tab.icon}</span>}
              {tab.label}
              {tab.badge && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
      
      <div className={contentClasses}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`tabpanel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            className={activeTab === tab.id ? 'block' : 'hidden'}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  )
}

// Simple Tabs for basic use cases
interface SimpleTabsProps {
  tabs: Array<{
    id: string
    label: string
    content: ReactNode
  }>
  defaultTab?: string
  className?: string
}

export const SimpleTabs: React.FC<SimpleTabsProps> = ({
  tabs,
  defaultTab,
  className = ''
}) => {
  return (
    <Tabs
      tabs={tabs}
      defaultTab={defaultTab}
      variant="default"
      className={className}
    />
  )
}

// Pills Tabs
interface PillsTabsProps {
  tabs: Array<{
    id: string
    label: string
    content: ReactNode
    disabled?: boolean
  }>
  defaultTab?: string
  className?: string
}

export const PillsTabs: React.FC<PillsTabsProps> = ({
  tabs,
  defaultTab,
  className = ''
}) => {
  return (
    <Tabs
      tabs={tabs}
      defaultTab={defaultTab}
      variant="pills"
      className={className}
    />
  )
}

// Card Tabs
interface CardTabsProps {
  tabs: Array<{
    id: string
    label: string
    content: ReactNode
    disabled?: boolean
  }>
  defaultTab?: string
  className?: string
}

export const CardTabs: React.FC<CardTabsProps> = ({
  tabs,
  defaultTab,
  className = ''
}) => {
  return (
    <Tabs
      tabs={tabs}
      defaultTab={defaultTab}
      variant="cards"
      className={className}
    />
  )
}

// Vertical Tabs
interface VerticalTabsProps {
  tabs: Array<{
    id: string
    label: string
    content: ReactNode
    disabled?: boolean
    icon?: string
  }>
  defaultTab?: string
  className?: string
}

export const VerticalTabs: React.FC<VerticalTabsProps> = ({
  tabs,
  defaultTab,
  className = ''
}) => {
  return (
    <Tabs
      tabs={tabs}
      defaultTab={defaultTab}
      orientation="vertical"
      variant="pills"
      className={className}
    />
  )
}
