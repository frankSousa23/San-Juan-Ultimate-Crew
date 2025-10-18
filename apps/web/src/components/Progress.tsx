import React from 'react'

interface ProgressProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  showLabel?: boolean
  label?: string
  showPercentage?: boolean
  animated?: boolean
  striped?: boolean
  className?: string
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  showPercentage = false,
  animated = false,
  striped = false,
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  const variantClasses = {
    default: 'bg-indigo-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
    info: 'bg-blue-600'
  }

  const baseClasses = 'w-full bg-gray-200 rounded-full overflow-hidden'
  const barClasses = [
    'h-full transition-all duration-300 ease-in-out',
    variantClasses[variant],
    animated ? 'animate-pulse' : '',
    striped ? 'bg-stripes' : ''
  ].filter(Boolean).join(' ')

  return (
    <div className={className}>
      {(showLabel || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {showLabel && (
            <span className="text-sm font-medium text-gray-700">
              {label || 'Progreso'}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm text-gray-500">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div className={`${baseClasses} ${sizeClasses[size]}`}>
        <div
          className={barClasses}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || 'Progreso'}
        />
      </div>
    </div>
  )
}

// Circular Progress
interface CircularProgressProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  showPercentage?: boolean
  strokeWidth?: number
  className?: string
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showPercentage = true,
  strokeWidth,
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24'
  }

  const variantClasses = {
    default: 'text-indigo-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    info: 'text-blue-600'
  }

  const defaultStrokeWidth = {
    sm: 3,
    md: 4,
    lg: 5,
    xl: 6
  }

  const actualStrokeWidth = strokeWidth || defaultStrokeWidth[size]

  return (
    <div className={`relative inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <svg
        className="transform -rotate-90"
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
      >
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth={actualStrokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth={actualStrokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-300 ease-in-out ${variantClasses[variant]}`}
        />
      </svg>
      
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-700">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  )
}

// Step Progress
interface StepProgressProps {
  steps: Array<{
    id: string
    title: string
    description?: string
    status: 'completed' | 'current' | 'upcoming'
  }>
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  orientation = 'horizontal',
  className = ''
}) => {
  const orientationClasses = {
    horizontal: 'flex items-center',
    vertical: 'flex flex-col space-y-4'
  }

  const getStepClasses = (status: string, index: number) => {
    const baseClasses = 'flex items-center'
    
    if (orientation === 'horizontal') {
      return `${baseClasses} ${index < steps.length - 1 ? 'flex-1' : ''}`
    }
    
    return baseClasses
  }

  const getStepIcon = (status: string, index: number) => {
    switch (status) {
      case 'completed':
        return '✅'
      case 'current':
        return '🔄'
      case 'upcoming':
        return '⏳'
      default:
        return (index + 1).toString()
    }
  }

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'current':
        return 'text-blue-600 bg-blue-100'
      case 'upcoming':
        return 'text-gray-400 bg-gray-100'
      default:
        return 'text-gray-400 bg-gray-100'
    }
  }

  return (
    <div className={`${orientationClasses[orientation]} ${className}`}>
      {steps.map((step, index) => (
        <div key={step.id} className={getStepClasses(step.status, index)}>
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getStepColor(step.status)}`}>
              <span className="text-sm font-medium">
                {getStepIcon(step.status, index)}
              </span>
            </div>
            <div className="ml-3">
              <div className={`text-sm font-medium ${
                step.status === 'completed' ? 'text-green-600' :
                step.status === 'current' ? 'text-blue-600' :
                'text-gray-500'
              }`}>
                {step.title}
              </div>
              {step.description && (
                <div className="text-xs text-gray-500">{step.description}</div>
              )}
            </div>
          </div>
          
          {orientation === 'horizontal' && index < steps.length - 1 && (
            <div className="flex-1 mx-4">
              <div className={`h-0.5 ${
                step.status === 'completed' ? 'bg-green-600' : 'bg-gray-300'
              }`} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Loading Progress (indeterminate)
interface LoadingProgressProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({
  size = 'md',
  variant = 'default',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const variantClasses = {
    default: 'bg-indigo-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
    info: 'bg-blue-600'
  }

  return (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}>
      <div
        className={`h-full ${variantClasses[variant]} animate-pulse`}
        style={{
          width: '100%',
          animation: 'loading 1.5s ease-in-out infinite'
        }}
      />
    </div>
  )
}
