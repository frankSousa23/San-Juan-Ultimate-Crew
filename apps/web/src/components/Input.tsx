import React, { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: string
  rightIcon?: string
  onLeftIconClick?: () => void
  onRightIconClick?: () => void
  variant?: 'default' | 'filled' | 'outlined'
  inputSize?: "sm" | "md" | "lg"
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onLeftIconClick,
  onRightIconClick,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

  const baseClasses = 'block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors'
  
  const variantClasses = {
    default: 'border',
    filled: 'border-0 bg-gray-100 focus:bg-white',
    outlined: 'border-2 bg-transparent focus:border-indigo-500'
  }

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  const errorClasses = error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
  const fullWidthClasses = fullWidth ? 'w-full' : ''
  const iconClasses = (leftIcon || rightIcon) ? 'pl-10 pr-10' : ''

  const inputClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    errorClasses,
    fullWidthClasses,
    iconClasses,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div 
            className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-${onLeftIconClick ? 'auto' : 'none'}`}
            onClick={onLeftIconClick}
          >
            <span className="text-gray-400">{leftIcon}</span>
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          {...props}
        />
        
        {rightIcon && (
          <div 
            className={`absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-${onRightIconClick ? 'auto' : 'none'}`}
            onClick={onRightIconClick}
          >
            <span className="text-gray-400">{rightIcon}</span>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

// Textarea component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  variant?: 'default' | 'filled' | 'outlined'
  inputSize?: "sm" | "md" | "lg"
  fullWidth?: boolean
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  resize = 'vertical',
  className = '',
  id,
  ...props
}, ref) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`

  const baseClasses = 'block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors'
  
  const variantClasses = {
    default: 'border',
    filled: 'border-0 bg-gray-100 focus:bg-white',
    outlined: 'border-2 bg-transparent focus:border-indigo-500'
  }

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize'
  }

  const errorClasses = error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
  const fullWidthClasses = fullWidth ? 'w-full' : ''

  const textareaClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    resizeClasses[resize],
    errorClasses,
    fullWidthClasses,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <textarea
        ref={ref}
        id={textareaId}
        className={textareaClasses}
        {...props}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'

// Select component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options: Array<{ value: string | number; label: string; disabled?: boolean }>
  placeholder?: string
  variant?: 'default' | 'filled' | 'outlined'
  inputSize?: "sm" | "md" | "lg"
  fullWidth?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helperText,
  options,
  placeholder,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`

  const baseClasses = 'block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors'
  
  const variantClasses = {
    default: 'border',
    filled: 'border-0 bg-gray-100 focus:bg-white',
    outlined: 'border-2 bg-transparent focus:border-indigo-500'
  }

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  const errorClasses = error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
  const fullWidthClasses = fullWidth ? 'w-full' : ''

  const selectClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    errorClasses,
    fullWidthClasses,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <select
        ref={ref}
        id={selectId}
        className={selectClasses}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
})

Select.displayName = 'Select'

// Search Input with debouncing
interface SearchInputProps extends Omit<InputProps, 'onChange'> {
  onSearch: (value: string) => void
  debounceMs?: number
  clearable?: boolean
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  debounceMs = 300,
  clearable = true,
  value,
  ...props
}) => {
  const [internalValue, setInternalValue] = React.useState(value || '')
  const timeoutRef = React.useRef<NodeJS.Timeout>()

  React.useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      onSearch(internalValue)
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [internalValue, onSearch, debounceMs])

  React.useEffect(() => {
    setInternalValue(value || '')
  }, [value])

  const handleClear = () => {
    setInternalValue('')
    onSearch('')
  }

  return (
    <Input
      {...props}
      value={internalValue}
      onChange={(e) => setInternalValue(e.target.value)}
      leftIcon="🔍"
      rightIcon={clearable && internalValue ? '✕' : undefined}
      onRightIconClick={clearable && internalValue ? handleClear : undefined}
    />
  )
}
