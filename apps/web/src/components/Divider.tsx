import React from 'react'

interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  thickness?: 'thin' | 'medium' | 'thick'
  color?: string
  style?: 'solid' | 'dashed' | 'dotted'
  spacing?: 'none' | 'small' | 'medium' | 'large'
  label?: string
  labelPosition?: 'left' | 'center' | 'right'
  className?: string
  style?: React.CSSProperties
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  thickness = 'thin',
  color = '#e5e7eb',
  style: lineStyle = 'solid',
  spacing = 'medium',
  label,
  labelPosition = 'center',
  className = '',
  style = {}
}) => {
  const getThickness = () => {
    switch (thickness) {
      case 'thin':
        return '1px'
      case 'medium':
        return '2px'
      case 'thick':
        return '4px'
      default:
        return '1px'
    }
  }

  const getSpacing = () => {
    switch (spacing) {
      case 'none':
        return '0'
      case 'small':
        return '0.5rem'
      case 'medium':
        return '1rem'
      case 'large':
        return '2rem'
      default:
        return '1rem'
    }
  }

  const getLineStyle = () => {
    switch (lineStyle) {
      case 'dashed':
        return 'dashed'
      case 'dotted':
        return 'dotted'
      case 'solid':
      default:
        return 'solid'
    }
  }

  const dividerStyle: React.CSSProperties = {
    ...style,
    borderStyle: getLineStyle(),
    borderColor: color,
    borderWidth: orientation === 'horizontal' ? `0 0 ${getThickness()} 0` : `0 0 0 ${getThickness()}`,
    margin: orientation === 'horizontal' ? `${getSpacing()} 0` : `0 ${getSpacing()}`
  }

  if (orientation === 'vertical') {
    return (
      <div
        className={`inline-block ${className}`}
        style={dividerStyle}
        aria-hidden="true"
      />
    )
  }

  if (label) {
    return (
      <div className={`flex items-center ${className}`} style={style}>
        {labelPosition === 'left' && (
          <span className="text-sm text-gray-500 mr-3 whitespace-nowrap">
            {label}
          </span>
        )}
        
        <div className="flex-1 flex items-center">
          {labelPosition === 'center' && (
            <>
              <div
                className="flex-1"
                style={{
                  borderTop: `${getThickness()} ${getLineStyle()} ${color}`
                }}
              />
              <span className="px-3 text-sm text-gray-500 whitespace-nowrap">
                {label}
              </span>
              <div
                className="flex-1"
                style={{
                  borderTop: `${getThickness()} ${getLineStyle()} ${color}`
                }}
              />
            </>
          )}
          
          {labelPosition === 'right' && (
            <div
              className="flex-1"
              style={{
                borderTop: `${getThickness()} ${getLineStyle()} ${color}`
              }}
            />
          )}
        </div>
        
        {labelPosition === 'right' && (
          <span className="text-sm text-gray-500 ml-3 whitespace-nowrap">
            {label}
          </span>
        )}
      </div>
    )
  }

  return (
    <hr
      className={className}
      style={dividerStyle}
      aria-hidden="true"
    />
  )
}

// Horizontal Divider component
interface HorizontalDividerProps {
  thickness?: 'thin' | 'medium' | 'thick'
  color?: string
  style?: 'solid' | 'dashed' | 'dotted'
  spacing?: 'none' | 'small' | 'medium' | 'large'
  label?: string
  labelPosition?: 'left' | 'center' | 'right'
  className?: string
  style?: React.CSSProperties
}

export const HorizontalDivider: React.FC<HorizontalDividerProps> = ({
  thickness = 'thin',
  color = '#e5e7eb',
  style: lineStyle = 'solid',
  spacing = 'medium',
  label,
  labelPosition = 'center',
  className = '',
  style = {}
}) => {
  return (
    <Divider
      orientation="horizontal"
      thickness={thickness}
      color={color}
      style={lineStyle}
      spacing={spacing}
      label={label}
      labelPosition={labelPosition}
      className={className}
      style={style}
    />
  )
}

// Vertical Divider component
interface VerticalDividerProps {
  thickness?: 'thin' | 'medium' | 'thick'
  color?: string
  style?: 'solid' | 'dashed' | 'dotted'
  spacing?: 'none' | 'small' | 'medium' | 'large'
  className?: string
  style?: React.CSSProperties
}

export const VerticalDivider: React.FC<VerticalDividerProps> = ({
  thickness = 'thin',
  color = '#e5e7eb',
  style: lineStyle = 'solid',
  spacing = 'medium',
  className = '',
  style = {}
}) => {
  return (
    <Divider
      orientation="vertical"
      thickness={thickness}
      color={color}
      style={lineStyle}
      spacing={spacing}
      className={className}
      style={style}
    />
  )
}

// Section Divider component
interface SectionDividerProps {
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  thickness?: 'thin' | 'medium' | 'thick'
  color?: string
  style?: 'solid' | 'dashed' | 'dotted'
  spacing?: 'none' | 'small' | 'medium' | 'large'
  className?: string
  style?: React.CSSProperties
}

export const SectionDivider: React.FC<SectionDividerProps> = ({
  title,
  subtitle,
  icon,
  thickness = 'thin',
  color = '#e5e7eb',
  style: lineStyle = 'solid',
  spacing = 'large',
  className = '',
  style = {}
}) => {
  return (
    <div className={`text-center ${className}`} style={style}>
      {title && (
        <div className="flex items-center justify-center mb-2">
          {icon && (
            <div className="mr-2 text-gray-500">
              {icon}
            </div>
          )}
          <h2 className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
        </div>
      )}
      
      {subtitle && (
        <p className="text-sm text-gray-600 mb-4">
          {subtitle}
        </p>
      )}
      
      <HorizontalDivider
        thickness={thickness}
        color={color}
        style={lineStyle}
        spacing={spacing}
      />
    </div>
  )
}

// Spacer component
interface SpacerProps {
  size?: 'none' | 'small' | 'medium' | 'large' | 'xlarge'
  orientation?: 'horizontal' | 'vertical'
  className?: string
  style?: React.CSSProperties
}

export const Spacer: React.FC<SpacerProps> = ({
  size = 'medium',
  orientation = 'vertical',
  className = '',
  style = {}
}) => {
  const getSize = () => {
    switch (size) {
      case 'none':
        return '0'
      case 'small':
        return '0.5rem'
      case 'medium':
        return '1rem'
      case 'large':
        return '2rem'
      case 'xlarge':
        return '4rem'
      default:
        return '1rem'
    }
  }

  const spacerStyle: React.CSSProperties = {
    ...style,
    [orientation === 'horizontal' ? 'width' : 'height']: getSize()
  }

  return (
    <div
      className={className}
      style={spacerStyle}
      aria-hidden="true"
    />
  )
}
