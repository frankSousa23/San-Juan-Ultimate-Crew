import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'link'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  icon?: string
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    link: 'bg-transparent text-indigo-600 hover:text-indigo-700 focus:ring-indigo-500 underline'
  }

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-base'
  }

  const widthClasses = fullWidth ? 'w-full' : ''

  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClasses,
    className
  ].filter(Boolean).join(' ')

  const isDisabled = disabled || loading

  return (
    <button
      className={combinedClasses}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      )}
      {!loading && icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  )
}

// Specialized button components
interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: string
  'aria-label': string
  tooltip?: string
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  tooltip,
  size = 'md',
  variant = 'ghost',
  ...props
}) => {
  const sizeClasses = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
    xl: 'p-3'
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`${sizeClasses[size]} ${tooltip ? 'relative group' : ''}`}
      {...props}
    >
      <span className="text-lg">{icon}</span>
      {tooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          {tooltip}
        </div>
      )}
    </Button>
  )
}

interface ActionButtonProps extends ButtonProps {
  action: 'create' | 'edit' | 'delete' | 'save' | 'cancel' | 'confirm' | 'close'
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  action,
  children,
  ...props
}) => {
  const actionConfig = {
    create: { icon: '➕', variant: 'primary' as const, defaultText: 'Crear' },
    edit: { icon: '✏️', variant: 'secondary' as const, defaultText: 'Editar' },
    delete: { icon: '🗑️', variant: 'danger' as const, defaultText: 'Eliminar' },
    save: { icon: '💾', variant: 'success' as const, defaultText: 'Guardar' },
    cancel: { icon: '❌', variant: 'ghost' as const, defaultText: 'Cancelar' },
    confirm: { icon: '✅', variant: 'success' as const, defaultText: 'Confirmar' },
    close: { icon: '✕', variant: 'ghost' as const, defaultText: 'Cerrar' }
  }

  const config = actionConfig[action]
  const displayText = children || config.defaultText

  return (
    <Button
      icon={config.icon}
      variant={config.variant}
      {...props}
    >
      {displayText}
    </Button>
  )
}

interface ButtonGroupProps {
  children: React.ReactNode
  orientation?: 'horizontal' | 'vertical'
  spacing?: 'none' | 'sm' | 'md'
  className?: string
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  orientation = 'horizontal',
  spacing = 'sm',
  className = ''
}) => {
  const orientationClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col'
  }

  const spacingClasses = {
    none: '',
    sm: orientation === 'horizontal' ? 'space-x-1' : 'space-y-1',
    md: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2'
  }

  const combinedClasses = [
    'inline-flex',
    orientationClasses[orientation],
    spacingClasses[spacing],
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={combinedClasses}>
      {children}
    </div>
  )
}

// Floating Action Button
interface FloatingActionButtonProps extends Omit<ButtonProps, 'size'> {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  size?: 'sm' | 'md' | 'lg'
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  position = 'bottom-right',
  size = 'md',
  className = '',
  ...props
}) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6'
  }

  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-14 h-14 text-xl',
    lg: 'w-16 h-16 text-2xl'
  }

  const combinedClasses = [
    positionClasses[position],
    sizeClasses[size],
    'rounded-full shadow-lg z-40',
    className
  ].filter(Boolean).join(' ')

  return (
    <Button
      size="md"
      className={combinedClasses}
      {...props}
    />
  )
}
