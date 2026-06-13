import React, { useRef, useEffect } from 'react'

interface ChartProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'radar' | 'polar'
  data: unknown
  options?: unknown
  width?: string | number
  height?: string | number
  className?: string
  style?: React.CSSProperties
}

export const Chart: React.FC<ChartProps> = ({
  type,
  data,
  options = {},
  width = '100%',
  height = '400px',
  className = '',
  style = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Simple chart rendering without external libraries
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Simple chart rendering based on type
    switch (type) {
      case 'line':
        renderLineChart(ctx, data, options)
        break
      case 'bar':
        renderBarChart(ctx, data, options)
        break
      case 'pie':
        renderPieChart(ctx, data, options)
        break
      case 'doughnut':
        renderDoughnutChart(ctx, data, options)
        break
      case 'area':
        renderAreaChart(ctx, data, options)
        break
      case 'scatter':
        renderScatterChart(ctx, data, options)
        break
      case 'radar':
        renderRadarChart(ctx, data, options)
        break
      case 'polar':
        renderPolarChart(ctx, data, options)
        break
      default:
        renderLineChart(ctx, data, options)
    }
  }, [type, data, options])

  const renderLineChart = (ctx: CanvasRenderingContext2D, data: any, _options: any) => {
    if (!data.datasets || !data.datasets[0]) return

    const dataset = data.datasets[0]
    const labels = data.labels || []
    const values = dataset.data || []

    if (values.length === 0) return

    const padding = 40
    const chartWidth = ctx.canvas.width - 2 * padding
    const chartHeight = ctx.canvas.height - 2 * padding

    const maxValue = Math.max(...values)
    const minValue = Math.min(...values)
    const valueRange = maxValue - minValue

    // Draw axes
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, ctx.canvas.height - padding)
    ctx.lineTo(ctx.canvas.width - padding, ctx.canvas.height - padding)
    ctx.stroke()

    // Draw line
    ctx.strokeStyle = dataset.borderColor || '#3b82f6'
    ctx.lineWidth = 2
    ctx.beginPath()

    values.forEach((value: number, index: number) => {
      const x = padding + (index / (values.length - 1)) * chartWidth
      const y = ctx.canvas.height - padding - ((value - minValue) / valueRange) * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Draw points
    ctx.fillStyle = dataset.backgroundColor || '#3b82f6'
    values.forEach((value: number, index: number) => {
      const x = padding + (index / (values.length - 1)) * chartWidth
      const y = ctx.canvas.height - padding - ((value - minValue) / valueRange) * chartHeight

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()
    })
  }

  const renderBarChart = (ctx: CanvasRenderingContext2D, data: any, _options: any) => {
    if (!data.datasets || !data.datasets[0]) return

    const dataset = data.datasets[0]
    const values = dataset.data || []

    if (values.length === 0) return

    const padding = 40
    const chartWidth = ctx.canvas.width - 2 * padding
    const chartHeight = ctx.canvas.height - 2 * padding

    const maxValue = Math.max(...values)
    const barWidth = chartWidth / values.length * 0.8
    const barSpacing = chartWidth / values.length * 0.2

    // Draw bars
    ctx.fillStyle = dataset.backgroundColor || '#3b82f6'
    values.forEach((value: number, index: number) => {
      const x = padding + index * (barWidth + barSpacing) + barSpacing / 2
      const barHeight = (value / maxValue) * chartHeight
      const y = ctx.canvas.height - padding - barHeight

      ctx.fillRect(x, y, barWidth, barHeight)
    })
  }

  const renderPieChart = (ctx: CanvasRenderingContext2D, data: any, _options: any) => {
    if (!data.datasets || !data.datasets[0]) return

    const dataset = data.datasets[0]
    const values = dataset.data || []
    const labels = data.labels || []

    if (values.length === 0) return

    const centerX = ctx.canvas.width / 2
    const centerY = ctx.canvas.height / 2
    const radius = Math.min(centerX, centerY) - 40

    const total = values.reduce((sum: number, value: number) => sum + value, 0)
    let currentAngle = -Math.PI / 2

    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
    ]

    values.forEach((value: number, index: number) => {
      const sliceAngle = (value / total) * 2 * Math.PI

      ctx.fillStyle = colors[index % colors.length]
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
      ctx.closePath()
      ctx.fill()

      currentAngle += sliceAngle
    })
  }

  const renderDoughnutChart = (ctx: CanvasRenderingContext2D, data: any, _options: any) => {
    if (!data.datasets || !data.datasets[0]) return

    const dataset = data.datasets[0]
    const values = dataset.data || []
    const labels = data.labels || []

    if (values.length === 0) return

    const centerX = ctx.canvas.width / 2
    const centerY = ctx.canvas.height / 2
    const outerRadius = Math.min(centerX, centerY) - 40
    const innerRadius = outerRadius * 0.6

    const total = values.reduce((sum: number, value: number) => sum + value, 0)
    let currentAngle = -Math.PI / 2

    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
    ]

    values.forEach((value: number, index: number) => {
      const sliceAngle = (value / total) * 2 * Math.PI

      ctx.fillStyle = colors[index % colors.length]
      ctx.beginPath()
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle)
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true)
      ctx.closePath()
      ctx.fill()

      currentAngle += sliceAngle
    })
  }

  const renderAreaChart = (ctx: CanvasRenderingContext2D, data: any, _options: any) => {
    if (!data.datasets || !data.datasets[0]) return

    const dataset = data.datasets[0]
    const values = dataset.data || []

    if (values.length === 0) return

    const padding = 40
    const chartWidth = ctx.canvas.width - 2 * padding
    const chartHeight = ctx.canvas.height - 2 * padding

    const maxValue = Math.max(...values)
    const minValue = Math.min(...values)
    const valueRange = maxValue - minValue

    // Draw area
    ctx.fillStyle = dataset.backgroundColor || '#3b82f6'
    ctx.beginPath()

    values.forEach((value: number, index: number) => {
      const x = padding + (index / (values.length - 1)) * chartWidth
      const y = ctx.canvas.height - padding - ((value - minValue) / valueRange) * chartHeight

      if (index === 0) {
        ctx.moveTo(x, ctx.canvas.height - padding)
        ctx.lineTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.lineTo(ctx.canvas.width - padding, ctx.canvas.height - padding)
    ctx.closePath()
    ctx.fill()

    // Draw line
    ctx.strokeStyle = dataset.borderColor || '#1d4ed8'
    ctx.lineWidth = 2
    ctx.beginPath()

    values.forEach((value: number, index: number) => {
      const x = padding + (index / (values.length - 1)) * chartWidth
      const y = ctx.canvas.height - padding - ((value - minValue) / valueRange) * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()
  }

  const renderScatterChart = (ctx: CanvasRenderingContext2D, data: any, _options: any) => {
    if (!data.datasets || !data.datasets[0]) return

    const dataset = data.datasets[0]
    const points = dataset.data || []

    if (points.length === 0) return

    const padding = 40
    const chartWidth = ctx.canvas.width - 2 * padding
    const chartHeight = ctx.canvas.height - 2 * padding

    const xValues = points.map((point: any) => point.x)
    const yValues = points.map((point: any) => point.y)

    const maxX = Math.max(...xValues)
    const minX = Math.min(...xValues)
    const maxY = Math.max(...yValues)
    const minY = Math.min(...yValues)

    const xRange = maxX - minX
    const yRange = maxY - minY

    // Draw points
    ctx.fillStyle = dataset.backgroundColor || '#3b82f6'
    points.forEach((point: any) => {
      const x = padding + ((point.x - minX) / xRange) * chartWidth
      const y = ctx.canvas.height - padding - ((point.y - minY) / yRange) * chartHeight

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()
    })
  }

  const renderRadarChart = (ctx: CanvasRenderingContext2D, data: any, _options: any) => {
    // Simple radar chart implementation
    const centerX = ctx.canvas.width / 2
    const centerY = ctx.canvas.height / 2
    const radius = Math.min(centerX, centerY) - 40

    const values = data.datasets?.[0]?.data || []

    if (values.length === 0) return

    const maxValue = Math.max(...values)
    const angleStep = (2 * Math.PI) / values.length

    // Draw radar grid
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1

    for (let i = 0; i < 5; i++) {
      const r = (radius / 5) * (i + 1)
      ctx.beginPath()
      ctx.arc(centerX, centerY, r, 0, 2 * Math.PI)
      ctx.stroke()
    }

    // Draw axes
    for (let i = 0; i < values.length; i++) {
      const angle = i * angleStep - Math.PI / 2
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(x, y)
      ctx.stroke()
    }

    // Draw data
    ctx.strokeStyle = '#3b82f6'
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'
    ctx.lineWidth = 2

    ctx.beginPath()
    values.forEach((value: number, index: number) => {
      const angle = index * angleStep - Math.PI / 2
      const r = (value / maxValue) * radius
      const x = centerX + Math.cos(angle) * r
      const y = centerY + Math.sin(angle) * r

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  const renderPolarChart = (ctx: CanvasRenderingContext2D, data: any, _options: any) => {
    // Simple polar chart implementation
    const centerX = ctx.canvas.width / 2
    const centerY = ctx.canvas.height / 2
    const radius = Math.min(centerX, centerY) - 40

    const values = data.datasets?.[0]?.data || []

    if (values.length === 0) return

    const total = values.reduce((sum: number, value: number) => sum + value, 0)
    let currentAngle = -Math.PI / 2

    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
    ]

    values.forEach((value: number, index: number) => {
      const sliceAngle = (value / total) * 2 * Math.PI

      ctx.fillStyle = colors[index % colors.length]
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
      ctx.closePath()
      ctx.fill()

      currentAngle += sliceAngle
    })
  }

  const combinedStyle: React.CSSProperties = {
    ...style,
    width,
    height
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={combinedStyle}
    />
  )
}

// Line Chart component
interface LineChartProps {
  data: any
  options?: any
  width?: string | number
  height?: string | number
  className?: string
  style?: React.CSSProperties
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  options = {},
  width = '100%',
  height = '400px',
  className = '',
  style = {}
}) => {
  return (
    <Chart
      type="line"
      data={data}
      options={options}
      width={width}
      height={height}
      className={className}
      style={style}
    />
  )
}

// Bar Chart component
interface BarChartProps {
  data: any
  options?: any
  width?: string | number
  height?: string | number
  className?: string
  style?: React.CSSProperties
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  options = {},
  width = '100%',
  height = '400px',
  className = '',
  style = {}
}) => {
  return (
    <Chart
      type="bar"
      data={data}
      options={options}
      width={width}
      height={height}
      className={className}
      style={style}
    />
  )
}

// Pie Chart component
interface PieChartProps {
  data: any
  options?: any
  width?: string | number
  height?: string | number
  className?: string
  style?: React.CSSProperties
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  options = {},
  width = '100%',
  height = '400px',
  className = '',
  style = {}
}) => {
  return (
    <Chart
      type="pie"
      data={data}
      options={options}
      width={width}
      height={height}
      className={className}
      style={style}
    />
  )
}

// Doughnut Chart component
interface DoughnutChartProps {
  data: any
  options?: any
  width?: string | number
  height?: string | number
  className?: string
  style?: React.CSSProperties
}

export const DoughnutChart: React.FC<DoughnutChartProps> = ({
  data,
  options = {},
  width = '100%',
  height = '400px',
  className = '',
  style = {}
}) => {
  return (
    <Chart
      type="doughnut"
      data={data}
      options={options}
      width={width}
      height={height}
      className={className}
      style={style}
    />
  )
}

// Area Chart component
interface AreaChartProps {
  data: any
  options?: any
  width?: string | number
  height?: string | number
  className?: string
  style?: React.CSSProperties
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  options = {},
  width = '100%',
  height = '400px',
  className = '',
  style = {}
}) => {
  return (
    <Chart
      type="area"
      data={data}
      options={options}
      width={width}
      height={height}
      className={className}
      style={style}
    />
  )
}

// Scatter Chart component
interface ScatterChartProps {
  data: any
  options?: any
  width?: string | number
  height?: string | number
  className?: string
  style?: React.CSSProperties
}

export const ScatterChart: React.FC<ScatterChartProps> = ({
  data,
  options = {},
  width = '100%',
  height = '400px',
  className = '',
  style = {}
}) => {
  return (
    <Chart
      type="scatter"
      data={data}
      options={options}
      width={width}
      height={height}
      className={className}
      style={style}
    />
  )
}

// Radar Chart component
interface RadarChartProps {
  data: any
  options?: any
  width?: string | number
  height?: string | number
  className?: string
  style?: React.CSSProperties
}

export const RadarChart: React.FC<RadarChartProps> = ({
  data,
  options = {},
  width = '100%',
  height = '400px',
  className = '',
  style = {}
}) => {
  return (
    <Chart
      type="radar"
      data={data}
      options={options}
      width={width}
      height={height}
      className={className}
      style={style}
    />
  )
}

// Polar Chart component
interface PolarChartProps {
  data: any
  options?: any
  width?: string | number
  height?: string | number
  className?: string
  style?: React.CSSProperties
}

export const PolarChart: React.FC<PolarChartProps> = ({
  data,
  options = {},
  width = '100%',
  height = '400px',
  className = '',
  style = {}
}) => {
  return (
    <Chart
      type="polar"
      data={data}
      options={options}
      width={width}
      height={height}
      className={className}
      style={style}
    />
  )
}
