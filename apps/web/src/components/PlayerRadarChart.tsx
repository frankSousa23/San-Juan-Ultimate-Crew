import React, { useId } from 'react'

export interface SkillAxisData {
  catching: number // 0 - 100
  throwing: number // 0 - 100
  defense: number  // 0 - 100
  spirit: number   // 0 - 100
  stamina: number  // 0 - 100
}

export interface PlayerRadarChartProps {
  data: SkillAxisData
  benchmarkData?: SkillAxisData
  dataLabel?: string
  benchmarkLabel?: string
  size?: number
  className?: string
  showLegend?: boolean
}

interface AxisDefinition {
  key: keyof SkillAxisData
  label: string
  icon: string
  color: string
}

const AXES: AxisDefinition[] = [
  { key: 'catching', label: 'Catching', icon: '🥏', color: '#38bdf8' },
  { key: 'throwing', label: 'Throwing', icon: '🎯', color: '#818cf8' },
  { key: 'defense', label: 'Defense', icon: '🛡️', color: '#f43f5e' },
  { key: 'spirit', label: 'Spirit', icon: '🕊️', color: '#10b981' },
  { key: 'stamina', label: 'Stamina', icon: '⚡', color: '#f59e0b' },
]

export default function PlayerRadarChart({
  data,
  benchmarkData,
  dataLabel = 'Rendimiento',
  benchmarkLabel = 'Promedio Equipo',
  size = 340,
  className = '',
  showLegend = true,
}: PlayerRadarChartProps) {
  const gradientId = useId()
  const cx = size / 2
  const cy = size / 2
  const maxRadius = size * 0.36
  const numAxes = AXES.length

  // Calculate polygon points string for a given dataset
  const getPolygonPoints = (dataset: SkillAxisData): string => {
    return AXES.map((axis, i) => {
      const angle = (2 * Math.PI / numAxes) * i - Math.PI / 2
      const val = Math.max(10, Math.min(100, dataset[axis.key] || 0))
      const radius = (val / 100) * maxRadius
      const x = cx + radius * Math.cos(angle)
      const y = cy + radius * Math.sin(angle)
      return `${x},${y}`
    }).join(' ')
  }

  // Get vertex points for dots
  const getVertexPoints = (dataset: SkillAxisData) => {
    return AXES.map((axis, i) => {
      const angle = (2 * Math.PI / numAxes) * i - Math.PI / 2
      const val = Math.max(10, Math.min(100, dataset[axis.key] || 0))
      const radius = (val / 100) * maxRadius
      const x = cx + radius * Math.cos(angle)
      const y = cy + radius * Math.sin(angle)
      return { x, y, value: dataset[axis.key], axis }
    })
  }

  // Concentric levels (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0]

  const dataPoints = getPolygonPoints(data)
  const dataVertices = getVertexPoints(data)
  const benchmarkPoints = benchmarkData ? getPolygonPoints(benchmarkData) : null

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
          </linearGradient>
          <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#4f46e5" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Concentric Pentagonal Web Grid */}
        {gridLevels.map((lvl, idx) => {
          const points = AXES.map((_, i) => {
            const angle = (2 * Math.PI / numAxes) * i - Math.PI / 2
            const r = maxRadius * lvl
            const x = cx + r * Math.cos(angle)
            const y = cy + r * Math.sin(angle)
            return `${x},${y}`
          }).join(' ')

          return (
            <polygon
              key={`grid-${idx}`}
              points={points}
              fill={idx % 2 === 0 ? 'rgba(241, 245, 249, 0.4)' : 'rgba(248, 250, 252, 0.8)'}
              stroke="rgba(148, 163, 184, 0.35)"
              strokeWidth="1.2"
              strokeDasharray={idx < 4 ? '3,3' : undefined}
            />
          )
        })}

        {/* Radial Axis Spokes */}
        {AXES.map((axis, i) => {
          const angle = (2 * Math.PI / numAxes) * i - Math.PI / 2
          const x = cx + maxRadius * Math.cos(angle)
          const y = cy + maxRadius * Math.sin(angle)

          return (
            <line
              key={`spoke-${axis.key}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="rgba(148, 163, 184, 0.4)"
              strokeWidth="1.5"
            />
          )
        })}

        {/* Benchmark Polygon Overlay (e.g. Squad Average) */}
        {benchmarkPoints && (
          <polygon
            points={benchmarkPoints}
            fill="rgba(245, 158, 11, 0.12)"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4,4"
            className="transition-all duration-700 ease-in-out"
          />
        )}

        {/* Primary Data Polygon */}
        <polygon
          points={dataPoints}
          fill={`url(#${gradientId})`}
          stroke="#4f46e5"
          strokeWidth="2.5"
          filter={`url(#glow-${gradientId})`}
          className="transition-all duration-700 ease-in-out"
        />

        {/* Vertex Data Point Dots */}
        {dataVertices.map(pt => (
          <g key={`dot-${pt.axis.key}`} className="transition-all duration-700 ease-in-out">
            <circle
              cx={pt.x}
              cy={pt.y}
              r="5"
              fill="#ffffff"
              stroke="#4338ca"
              strokeWidth="2.5"
              className="drop-shadow hover:scale-125 transition-transform"
            />
            <circle
              cx={pt.x}
              cy={pt.y}
              r="2"
              fill="#4338ca"
            />
          </g>
        ))}

        {/* Outer Axis Labels and Scores */}
        {AXES.map((axis, i) => {
          const angle = (2 * Math.PI / numAxes) * i - Math.PI / 2
          const labelDist = maxRadius * 1.28
          const lx = cx + labelDist * Math.cos(angle)
          const ly = cy + labelDist * Math.sin(angle)
          const score = data[axis.key] || 0

          // Text anchors based on position
          const textAnchor = Math.abs(Math.cos(angle)) < 0.15 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end'

          return (
            <g key={`label-${axis.key}`} transform={`translate(${lx}, ${ly})`}>
              <text
                textAnchor={textAnchor}
                dominantBaseline="central"
                className="font-extrabold text-[11px] fill-slate-800"
              >
                {axis.icon} {axis.label}
              </text>
              <text
                textAnchor={textAnchor}
                dominantBaseline="central"
                y="13"
                className="font-black text-[10px] fill-indigo-600 font-mono"
              >
                {score}/100
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend & Score Summary */}
      {showLegend && (
        <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 border border-indigo-600 shadow-xs inline-block" />
            <span className="font-bold text-slate-700">{dataLabel}</span>
          </div>
          {benchmarkData && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-100 border-2 border-dashed border-amber-500 inline-block" />
              <span className="font-bold text-amber-800">{benchmarkLabel}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
