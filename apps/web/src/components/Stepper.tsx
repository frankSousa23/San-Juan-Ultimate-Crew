import React from 'react'

interface Step {
  id: string
  title: string
  description?: string
  icon?: React.ReactNode
  status?: 'completed' | 'current' | 'upcoming' | 'error'
  content?: React.ReactNode
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  orientation?: 'horizontal' | 'vertical'
  showConnector?: boolean
  showNumbers?: boolean
  showIcons?: boolean
  showDescriptions?: boolean
  onStepClick?: (stepIndex: number) => void
  className?: string
  style?: React.CSSProperties
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  orientation = 'horizontal',
  showConnector = true,
  showNumbers = true,
  showIcons = true,
  showDescriptions = true,
  onStepClick,
  className = '',
  style = {}
}) => {
  const getStepStatus = (stepIndex: number): Step['status'] => {
    if (stepIndex < currentStep) return 'completed'
    if (stepIndex === currentStep) return 'current'
    if (stepIndex > currentStep) return 'upcoming'
    return 'upcoming'
  }

  const getStatusColor = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-500 text-white'
      case 'current':
        return 'bg-blue-500 border-blue-500 text-white'
      case 'error':
        return 'bg-red-500 border-red-500 text-white'
      case 'upcoming':
      default:
        return 'bg-gray-200 border-gray-300 text-gray-500'
    }
  }

  const getConnectorColor = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'bg-green-500'
    return 'bg-gray-300'
  }

  if (orientation === 'vertical') {
    return (
      <div className={`relative ${className}`} style={style}>
        {/* Vertical Line */}
        {showConnector && (
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300" />
        )}

        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step, index) => {
            const status = getStepStatus(index)
            const isClickable = onStepClick && index <= currentStep

            return (
              <div key={step.id} className="relative flex items-start">
                {/* Step Circle */}
                <div className="relative z-10">
                  <div
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      getStatusColor(status)
                    } ${isClickable ? 'cursor-pointer hover:scale-105' : ''}`}
                    onClick={() => isClickable && onStepClick(index)}
                  >
                    {showIcons && step.icon ? (
                      <div className="text-lg">
                        {step.icon}
                      </div>
                    ) : showNumbers ? (
                      <span className="text-sm font-semibold">
                        {index + 1}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Step Content */}
                <div className="ml-6 flex-1">
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {step.title}
                    </h3>
                    
                    {showDescriptions && step.description && (
                      <p className="text-gray-600 mb-3">
                        {step.description}
                      </p>
                    )}
                    
                    {step.content && (
                      <div className="mt-3">
                        {step.content}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`} style={style}>
      {/* Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(index)
          const isClickable = onStepClick && index <= currentStep

          return (
            <div key={step.id} className="flex items-center">
              {/* Step Circle */}
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                  getStatusColor(status)
                } ${isClickable ? 'cursor-pointer hover:scale-105' : ''}`}
                onClick={() => isClickable && onStepClick(index)}
              >
                {showIcons && step.icon ? (
                  <div className="text-sm">
                    {step.icon}
                  </div>
                ) : showNumbers ? (
                  <span className="text-xs font-semibold">
                    {index + 1}
                  </span>
                ) : null}
              </div>

              {/* Step Label */}
              <div className="ml-3 text-center">
                <h4 className="text-sm font-medium text-gray-900">
                  {step.title}
                </h4>
                {showDescriptions && step.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </p>
                )}
              </div>

              {/* Connector */}
              {showConnector && index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div className="h-0.5 bg-gray-300 relative">
                    <div
                      className={`h-full transition-all duration-300 ${getConnectorColor(index)}`}
                      style={{
                        width: index < currentStep ? '100%' : '0%'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Progress Stepper component
interface ProgressStepperProps {
  steps: Step[]
  currentStep: number
  progress?: number
  showProgress?: boolean
  showConnector?: boolean
  showNumbers?: boolean
  showIcons?: boolean
  showDescriptions?: boolean
  onStepClick?: (stepIndex: number) => void
  className?: string
  style?: React.CSSProperties
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps,
  currentStep,
  progress,
  showProgress = true,
  showConnector = true,
  showNumbers = true,
  showIcons = true,
  showDescriptions = true,
  onStepClick,
  className = '',
  style = {}
}) => {
  const getStepStatus = (stepIndex: number): Step['status'] => {
    if (stepIndex < currentStep) return 'completed'
    if (stepIndex === currentStep) return 'current'
    if (stepIndex > currentStep) return 'upcoming'
    return 'upcoming'
  }

  const getStatusColor = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-500 text-white'
      case 'current':
        return 'bg-blue-500 border-blue-500 text-white'
      case 'error':
        return 'bg-red-500 border-red-500 text-white'
      case 'upcoming':
      default:
        return 'bg-gray-200 border-gray-300 text-gray-500'
    }
  }

  const getConnectorColor = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'bg-green-500'
    return 'bg-gray-300'
  }

  const currentProgress = progress !== undefined ? progress : (currentStep / (steps.length - 1)) * 100

  return (
    <div className={`w-full ${className}`} style={style}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(currentProgress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(index)
          const isClickable = onStepClick && index <= currentStep

          return (
            <div key={step.id} className="flex items-center">
              {/* Step Circle */}
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                  getStatusColor(status)
                } ${isClickable ? 'cursor-pointer hover:scale-105' : ''}`}
                onClick={() => isClickable && onStepClick(index)}
              >
                {showIcons && step.icon ? (
                  <div className="text-sm">
                    {step.icon}
                  </div>
                ) : showNumbers ? (
                  <span className="text-xs font-semibold">
                    {index + 1}
                  </span>
                ) : null}
              </div>

              {/* Step Label */}
              <div className="ml-3 text-center">
                <h4 className="text-sm font-medium text-gray-900">
                  {step.title}
                </h4>
                {showDescriptions && step.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </p>
                )}
              </div>

              {/* Connector */}
              {showConnector && index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div className="h-0.5 bg-gray-300 relative">
                    <div
                      className={`h-full transition-all duration-300 ${getConnectorColor(index)}`}
                      style={{
                        width: index < currentStep ? '100%' : '0%'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Wizard Stepper component
interface WizardStep {
  id: string
  title: string
  description?: string
  icon?: React.ReactNode
  content: React.ReactNode
  validation?: () => boolean
  onNext?: () => void
  onPrevious?: () => void
}

interface WizardStepperProps {
  steps: WizardStep[]
  currentStep: number
  onStepChange: (stepIndex: number) => void
  onComplete?: () => void
  showProgress?: boolean
  showConnector?: boolean
  showNumbers?: boolean
  showIcons?: boolean
  showDescriptions?: boolean
  className?: string
  style?: React.CSSProperties
}

export const WizardStepper: React.FC<WizardStepperProps> = ({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  showProgress = true,
  showConnector = true,
  showNumbers = true,
  showIcons = true,
  showDescriptions = true,
  className = '',
  style = {}
}) => {
  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  const handleNext = () => {
    if (currentStepData.validation && !currentStepData.validation()) {
      return
    }

    if (currentStepData.onNext) {
      currentStepData.onNext()
    }

    if (isLastStep) {
      if (onComplete) {
        onComplete()
      }
    } else {
      onStepChange(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStepData.onPrevious) {
      currentStepData.onPrevious()
    }

    if (!isFirstStep) {
      onStepChange(currentStep - 1)
    }
  }

  const getStepStatus = (stepIndex: number): Step['status'] => {
    if (stepIndex < currentStep) return 'completed'
    if (stepIndex === currentStep) return 'current'
    if (stepIndex > currentStep) return 'upcoming'
    return 'upcoming'
  }

  const getStatusColor = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-500 text-white'
      case 'current':
        return 'bg-blue-500 border-blue-500 text-white'
      case 'error':
        return 'bg-red-500 border-red-500 text-white'
      case 'upcoming':
      default:
        return 'bg-gray-200 border-gray-300 text-gray-500'
    }
  }

  const getConnectorColor = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'bg-green-500'
    return 'bg-gray-300'
  }

  const currentProgress = (currentStep / (steps.length - 1)) * 100

  return (
    <div className={`w-full ${className}`} style={style}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(currentProgress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const status = getStepStatus(index)
          const isClickable = index <= currentStep

          return (
            <div key={step.id} className="flex items-center">
              {/* Step Circle */}
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                  getStatusColor(status)
                } ${isClickable ? 'cursor-pointer hover:scale-105' : ''}`}
                onClick={() => isClickable && onStepChange(index)}
              >
                {showIcons && step.icon ? (
                  <div className="text-sm">
                    {step.icon}
                  </div>
                ) : showNumbers ? (
                  <span className="text-xs font-semibold">
                    {index + 1}
                  </span>
                ) : null}
              </div>

              {/* Step Label */}
              <div className="ml-3 text-center">
                <h4 className="text-sm font-medium text-gray-900">
                  {step.title}
                </h4>
                {showDescriptions && step.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </p>
                )}
              </div>

              {/* Connector */}
              {showConnector && index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div className="h-0.5 bg-gray-300 relative">
                    <div
                      className={`h-full transition-all duration-300 ${getConnectorColor(index)}`}
                      style={{
                        width: index < currentStep ? '100%' : '0%'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        {currentStepData.content}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={isFirstStep}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <button
          onClick={handleNext}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
        >
          {isLastStep ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  )
}
