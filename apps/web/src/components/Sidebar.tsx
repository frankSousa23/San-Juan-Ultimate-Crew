import React, { useState, useEffect } from 'react'

interface SidebarItem {
  id: string
  label: string
  icon?: string
  href?: string
  onClick?: () => void
  badge?: string | number
  children?: SidebarItem[]
  disabled?: boolean
  active?: boolean
}

interface SidebarProps {
  items: SidebarItem[]
  isOpen: boolean
  onToggle: () => void
  variant?: 'default' | 'minimal' | 'compact'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onItemClick?: (item: SidebarItem) => void
  activeItem?: string
  collapsible?: boolean
  showToggle?: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  isOpen,
  onToggle,
  variant = 'default',
  size = 'md',
  className = '',
  onItemClick,
  activeItem,
  collapsible = true,
  showToggle = true
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const sizeClasses = {
    sm: {
      width: 'w-48',
      padding: 'p-2',
      text: 'text-xs',
      icon: 'w-4 h-4',
      item: 'px-2 py-1'
    },
    md: {
      width: 'w-64',
      padding: 'p-4',
      text: 'text-sm',
      icon: 'w-5 h-5',
      item: 'px-3 py-2'
    },
    lg: {
      width: 'w-80',
      padding: 'p-6',
      text: 'text-base',
      icon: 'w-6 h-6',
      item: 'px-4 py-3'
    }
  }

  const variantClasses = {
    default: 'bg-white border-r border-gray-200',
    minimal: 'bg-gray-50 border-r border-gray-100',
    compact: 'bg-white border-r border-gray-200'
  }

  const currentSize = sizeClasses[size]

  const handleItemClick = (item: SidebarItem) => {
    if (item.disabled) return

    if (item.children && item.children.length > 0) {
      // Toggle expanded state for items with children
      setExpandedItems(prev => {
        const newSet = new Set(prev)
        if (newSet.has(item.id)) {
          newSet.delete(item.id)
        } else {
          newSet.add(item.id)
        }
        return newSet
      })
    }

    if (item.onClick) {
      item.onClick()
    }

    if (item.href) {
      // Handle navigation
      window.location.href = item.href
    }

    onItemClick?.(item)
  }

  const renderItem = (item: SidebarItem, level: number = 0) => {
    const isExpanded = expandedItems.has(item.id)
    const isActive = activeItem === item.id || item.active
    const hasChildren = item.children && item.children.length > 0

    const itemClasses = [
      'flex items-center justify-between rounded-md transition-colors',
      currentSize.item,
      currentSize.text,
      isActive
        ? 'bg-indigo-100 text-indigo-700'
        : 'text-gray-700 hover:bg-gray-100',
      item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      level > 0 ? 'ml-4' : ''
    ].filter(Boolean).join(' ')

    return (
      <div key={item.id}>
        <div
          className={itemClasses}
          onClick={() => handleItemClick(item)}
        >
          <div className="flex items-center space-x-3">
            {item.icon && (
              <span className={`${currentSize.icon} flex-shrink-0`}>
                {item.icon}
              </span>
            )}
            <span className="flex-1 truncate">{item.label}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {item.badge && (
              <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <span className={`${currentSize.icon} flex-shrink-0 transition-transform ${
                isExpanded ? 'rotate-90' : 'rotate-0'
              }`}>
                ▶
              </span>
            )}
          </div>
        </div>

        {/* Render children */}
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${currentSize.width} ${variantClasses[variant]} ${className}`}
      >
        {/* Header */}
        <div className={`${currentSize.padding} border-b border-gray-200`}>
          <div className="flex items-center justify-between">
            <h2 className={`${currentSize.text} font-semibold text-gray-900`}>
              Menú
            </h2>
            {showToggle && (
              <button
                onClick={onToggle}
                className="p-1 rounded-md hover:bg-gray-100 lg:hidden"
              >
                <span className="text-gray-500">✕</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`${currentSize.padding} space-y-1 overflow-y-auto`}>
          {items.map(item => renderItem(item))}
        </nav>
      </div>
    </>
  )
}

// Simple Sidebar for basic use cases
interface SimpleSidebarProps {
  items: Array<{
    id: string
    label: string
    icon?: string
    href?: string
    onClick?: () => void
    active?: boolean
  }>
  isOpen: boolean
  onToggle: () => void
  className?: string
  onItemClick?: (item: any) => void
  activeItem?: string
}

export const SimpleSidebar: React.FC<SimpleSidebarProps> = ({
  items,
  isOpen,
  onToggle,
  className = '',
  onItemClick,
  activeItem
}) => {
  return (
    <Sidebar
      items={items}
      isOpen={isOpen}
      onToggle={onToggle}
      variant="default"
      size="md"
      className={className}
      onItemClick={onItemClick}
      activeItem={activeItem}
    />
  )
}

// Compact Sidebar for small spaces
interface CompactSidebarProps {
  items: Array<{
    id: string
    label: string
    icon?: string
    href?: string
    onClick?: () => void
    active?: boolean
  }>
  isOpen: boolean
  onToggle: () => void
  className?: string
  onItemClick?: (item: any) => void
  activeItem?: string
}

export const CompactSidebar: React.FC<CompactSidebarProps> = ({
  items,
  isOpen,
  onToggle,
  className = '',
  onItemClick,
  activeItem
}) => {
  return (
    <Sidebar
      items={items}
      isOpen={isOpen}
      onToggle={onToggle}
      variant="compact"
      size="sm"
      className={className}
      onItemClick={onItemClick}
      activeItem={activeItem}
    />
  )
}

// Sidebar with sections
interface SectionedSidebarProps {
  sections: Array<{
    title: string
    items: SidebarItem[]
  }>
  isOpen: boolean
  onToggle: () => void
  className?: string
  onItemClick?: (item: SidebarItem) => void
  activeItem?: string
}

export const SectionedSidebar: React.FC<SectionedSidebarProps> = ({
  sections,
  isOpen,
  onToggle,
  className = '',
  onItemClick,
  activeItem
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const handleItemClick = (item: SidebarItem) => {
    if (item.disabled) return

    if (item.children && item.children.length > 0) {
      setExpandedItems(prev => {
        const newSet = new Set(prev)
        if (newSet.has(item.id)) {
          newSet.delete(item.id)
        } else {
          newSet.add(item.id)
        }
        return newSet
      })
    }

    if (item.onClick) {
      item.onClick()
    }

    if (item.href) {
      window.location.href = item.href
    }

    onItemClick?.(item)
  }

  const renderItem = (item: SidebarItem, level: number = 0) => {
    const isExpanded = expandedItems.has(item.id)
    const isActive = activeItem === item.id || item.active
    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={item.id}>
        <div
          className={`flex items-center justify-between rounded-md transition-colors px-3 py-2 text-sm ${
            isActive
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-700 hover:bg-gray-100'
          } ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
            level > 0 ? 'ml-4' : ''
          }`}
          onClick={() => handleItemClick(item)}
        >
          <div className="flex items-center space-x-3">
            {item.icon && (
              <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
            )}
            <span className="flex-1 truncate">{item.label}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {item.badge && (
              <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <span className={`w-5 h-5 flex-shrink-0 transition-transform ${
                isExpanded ? 'rotate-90' : 'rotate-0'
              }`}>
                ▶
              </span>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64 bg-white border-r border-gray-200 ${className}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Menú</h2>
            <button
              onClick={onToggle}
              className="p-1 rounded-md hover:bg-gray-100 lg:hidden"
            >
              <span className="text-gray-500">✕</span>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-6 overflow-y-auto">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map(item => renderItem(item))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </>
  )
}
