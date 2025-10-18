import React, { useState, useRef, useEffect } from 'react'

interface DropdownItem {
  id: string
  label: string
  icon?: string
  disabled?: boolean
  divider?: boolean
  onClick?: () => void
}

interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'minimal'
  className?: string
  onItemClick?: (item: DropdownItem) => void
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  position = 'bottom-left',
  size = 'md',
  variant = 'default',
  className = '',
  onItemClick
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const positionClasses = {
    'bottom-left': 'top-full left-0 mt-1',
    'bottom-right': 'top-full right-0 mt-1',
    'top-left': 'bottom-full left-0 mb-1',
    'top-right': 'bottom-full right-0 mb-1'
  }

  const sizeClasses = {
    sm: 'min-w-32',
    md: 'min-w-48',
    lg: 'min-w-64'
  }

  const variantClasses = {
    default: 'bg-white border border-gray-200 shadow-lg',
    minimal: 'bg-white shadow-lg'
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled && !item.divider) {
      item.onClick?.()
      onItemClick?.(item)
      setIsOpen(false)
    }
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute z-50 ${positionClasses[position]} ${sizeClasses[size]} ${variantClasses[variant]} rounded-md overflow-hidden`}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return (
                <div key={`divider-${index}`} className="border-t border-gray-200" />
              )
            }

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={`w-full flex items-center px-4 py-2 text-left text-sm transition-colors ${
                  item.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.icon && <span className="mr-3">{item.icon}</span>}
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Simple Dropdown for basic use cases
interface SimpleDropdownProps {
  trigger: React.ReactNode
  items: Array<{
    id: string
    label: string
    onClick: () => void
  }>
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  className?: string
}

export const SimpleDropdown: React.FC<SimpleDropdownProps> = ({
  trigger,
  items,
  position = 'bottom-left',
  className = ''
}) => {
  const dropdownItems = items.map(item => ({
    id: item.id,
    label: item.label,
    onClick: item.onClick
  }))

  return (
    <Dropdown
      trigger={trigger}
      items={dropdownItems}
      position={position}
      className={className}
    />
  )
}

// Menu Dropdown with common menu items
interface MenuDropdownProps {
  trigger: React.ReactNode
  items: Array<{
    id: string
    label: string
    icon?: string
    onClick: () => void
    disabled?: boolean
  }>
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  className?: string
}

export const MenuDropdown: React.FC<MenuDropdownProps> = ({
  trigger,
  items,
  position = 'bottom-left',
  className = ''
}) => {
  const dropdownItems = items.map(item => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    onClick: item.onClick,
    disabled: item.disabled
  }))

  return (
    <Dropdown
      trigger={trigger}
      items={dropdownItems}
      position={position}
      className={className}
    />
  )
}

// Action Dropdown for common actions
interface ActionDropdownProps {
  trigger: React.ReactNode
  actions: Array<{
    id: string
    label: string
    icon?: string
    onClick: () => void
    disabled?: boolean
    variant?: 'default' | 'danger'
  }>
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  className?: string
}

export const ActionDropdown: React.FC<ActionDropdownProps> = ({
  trigger,
  actions,
  position = 'bottom-left',
  className = ''
}) => {
  const dropdownItems = actions.map(action => ({
    id: action.id,
    label: action.label,
    icon: action.icon,
    onClick: action.onClick,
    disabled: action.disabled
  }))

  return (
    <Dropdown
      trigger={trigger}
      items={dropdownItems}
      position={position}
      className={className}
    />
  )
}

// Select Dropdown for form selection
interface SelectDropdownProps {
  value: string
  options: Array<{
    value: string
    label: string
    disabled?: boolean
  }>
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export const SelectDropdown: React.FC<SelectDropdownProps> = ({
  value,
  options,
  onChange,
  placeholder = 'Seleccionar...',
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(option => option.value === value)

  const dropdownItems = options.map(option => ({
    id: option.value,
    label: option.label,
    onClick: () => onChange(option.value),
    disabled: option.disabled
  }))

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-left text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
          disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'hover:border-gray-400'
        }`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transform transition-transform ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          {dropdownItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => item.onClick()}
              disabled={item.disabled}
              className={`w-full flex items-center px-3 py-2 text-left text-sm transition-colors ${
                item.disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              } ${value === item.id ? 'bg-indigo-50 text-indigo-700' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
