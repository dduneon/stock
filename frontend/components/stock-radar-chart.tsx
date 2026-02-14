"use client"

interface StockRadarChartProps {
  scores: {
    valuation_score: number
    profitability_score: number
    growth_score: number
    momentum_score: number
    revision_score: number
  }
}

const FACTORS = [
  { key: "valuation_score", label: "Valuation", color: "oklch(0.75 0.24 142)" },
  { key: "profitability_score", label: "Profitability", color: "oklch(0.65 0.20 250)" },
  { key: "growth_score", label: "Growth", color: "oklch(0.75 0.18 80)" },
  { key: "momentum_score", label: "Momentum", color: "oklch(0.72 0.22 50)" },
  { key: "revision_score", label: "Revision", color: "oklch(0.70 0.20 300)" },
] as const

export function StockRadarChart({ scores }: StockRadarChartProps) {
  const size = 400
  const center = size / 2
  const radius = 140
  const levels = 5
  const angleStep = (Math.PI * 2) / 5

  const getPoint = (value: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2
    const r = (value / 100) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  const getLabelPosition = (index: number) => {
    const angle = index * angleStep - Math.PI / 2
    const labelRadius = radius + 35
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle),
    }
  }

  const dataPoints = FACTORS.map((factor, i) => ({
    ...factor,
    value: scores[factor.key as keyof typeof scores],
    point: getPoint(scores[factor.key as keyof typeof scores], i),
  }))

  const polygonPoints = dataPoints.map((p) => `${p.point.x},${p.point.y}`).join(" ")

  return (
    <div className="w-full">
      <div className="relative aspect-square max-w-[400px] mx-auto">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full"
          style={{ filter: "drop-shadow(0 4px 6px rgb(0 0 0 / 0.1))" }}
        >
          {/* Grid circles */}
          {Array.from({ length: levels }, (_, i) => {
            const levelRadius = ((i + 1) / levels) * radius
            const levelValue = ((i + 1) / levels) * 100
            return (
              <g key={i}>
                <circle
                  cx={center}
                  cy={center}
                  r={levelRadius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-border"
                />
                <text
                  x={center + levelRadius + 5}
                  y={center}
                  className="text-[10px] fill-muted-foreground font-mono"
                >
                  {levelValue}
                </text>
              </g>
            )
          })}

          {/* Axis lines */}
          {Array.from({ length: 5 }, (_, i) => {
            const angle = i * angleStep - Math.PI / 2
            const endX = center + radius * Math.cos(angle)
            const endY = center + radius * Math.sin(angle)
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={endX}
                y2={endY}
                stroke="currentColor"
                strokeWidth="1"
                className="text-border"
              />
            )
          })}

          {/* Data polygon */}
          <polygon
            points={polygonPoints}
            fill="oklch(0.75 0.24 142 / 0.2)"
            stroke="oklch(0.75 0.24 142)"
            strokeWidth="2"
            className="transition-all duration-500 ease-out"
          />

          {/* Data points */}
          {dataPoints.map((point, i) => (
            <g key={point.key}>
              <circle
                cx={point.point.x}
                cy={point.point.y}
                r="5"
                fill={point.color}
                stroke="currentColor"
                strokeWidth="2"
                className="text-background"
              />
              <text
                x={point.point.x}
                y={point.point.y - 10}
                textAnchor="middle"
                className="text-xs font-bold fill-accent font-mono"
              >
                {point.value}
              </text>
            </g>
          ))}

          {/* Labels */}
          {FACTORS.map((factor, i) => {
            const pos = getLabelPosition(i)
            const angle = i * angleStep - Math.PI / 2
            const isLeft = angle > Math.PI / 2 || angle < -Math.PI / 2
            return (
              <text
                key={factor.key}
                x={pos.x}
                y={pos.y}
                textAnchor={isLeft ? "end" : angle === 0 ? "middle" : "start"}
                dominantBaseline="middle"
                className="text-sm font-semibold fill-foreground"
              >
                {factor.label}
              </text>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t-2 border-border">
        {dataPoints.map((item) => (
          <div key={item.key} className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div
                className="h-3 w-3"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs uppercase font-semibold text-muted-foreground">
                {item.label}
              </span>
            </div>
            <div className="font-mono font-bold text-lg tabular-nums">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
