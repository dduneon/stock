"use client"

interface FinancialSummaryProps {
  financials: {
    per: number | null
    pbr: number | null
    roe: number | null
    revenue: number | null
    net_income: number | null
  }
}

function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return "N/A"
  
  const absValue = Math.abs(value)
  
  if (absValue >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(2)}T`
  }
  if (absValue >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`
  }
  if (absValue >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`
  }
  if (absValue >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`
  }
  
  return value.toFixed(2)
}

function formatRatio(value: number | null): string {
  if (value === null || value === undefined) return "N/A"
  return value.toFixed(2)
}

function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return "N/A"
  return `${value.toFixed(2)}%`
}

const metrics = [
  {
    key: "per",
    label: "P/E Ratio",
    description: "Price to Earnings",
    format: formatRatio,
    color: "text-chart-1",
  },
  {
    key: "pbr",
    label: "P/B Ratio",
    description: "Price to Book",
    format: formatRatio,
    color: "text-chart-2",
  },
  {
    key: "roe",
    label: "ROE",
    description: "Return on Equity",
    format: formatPercent,
    color: "text-chart-3",
  },
  {
    key: "revenue",
    label: "Revenue",
    description: "Annual Revenue",
    format: formatNumber,
    color: "text-chart-4",
  },
  {
    key: "net_income",
    label: "Net Income",
    description: "Annual Net Income",
    format: formatNumber,
    color: "text-chart-5",
  },
] as const

export function FinancialSummary({ financials }: FinancialSummaryProps) {
  return (
    <div className="divide-y-2 divide-border">
      {metrics.map((metric, index) => {
        const value = financials[metric.key as keyof typeof financials]
        const hasValue = value !== null && value !== undefined
        
        return (
          <div
            key={metric.key}
            className="p-4 md:p-6 flex items-center justify-between hover:bg-accent/5 transition-colors"
            style={{
              animation: "slideIn 0.4s ease-out",
              animationDelay: `${index * 80}ms`,
              animationFillMode: "backwards",
            }}
          >
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 ${metric.color.replace("text-", "bg-")}`} />
              <div>
                <div className="font-semibold text-sm md:text-base">{metric.label}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {metric.description}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`font-mono font-bold text-xl md:text-2xl tabular-nums ${hasValue ? metric.color : "text-muted-foreground"}`}>
                {metric.format(value)}
              </div>
              {metric.key === "per" && hasValue && (
                <div className="text-xs text-muted-foreground mt-1">
                  {value && value < 15 ? "Undervalued" : value && value > 25 ? "Overvalued" : "Fair"}
                </div>
              )}
              {metric.key === "roe" && hasValue && (
                <div className="text-xs text-muted-foreground mt-1">
                  {value && value > 15 ? "Strong" : value && value < 5 ? "Weak" : "Average"}
                </div>
              )}
            </div>
          </div>
        )
      })}
      
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
