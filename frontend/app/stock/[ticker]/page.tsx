"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { StockChart } from "@/components/stock-chart"
import { StockRadarChart } from "@/components/stock-radar-chart"
import { FinancialSummary } from "@/components/financial-summary"
import { WatchlistButton } from "@/components/watchlist-button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, TrendingUp, DollarSign, Activity, BarChart3 } from "lucide-react"

interface StockDetail {
  ticker: string
  name: string
  market: string
  sector: string
  latest_financials: {
    per: number | null
    pbr: number | null
    roe: number | null
    revenue: number | null
    net_income: number | null
  } | null
  latest_score: {
    total_score: number
    grade: string
    valuation_score: number
    profitability_score: number
    growth_score: number
    momentum_score: number
    revision_score: number
  } | null
}

const gradeColors: Record<string, string> = {
  "Strong Buy": "bg-chart-1 text-background",
  "Buy": "bg-chart-1/80 text-background",
  "Hold": "bg-chart-3 text-background",
  "Sell": "bg-destructive text-background",
}

export default function StockDetailPage() {
  const params = useParams()
  const ticker = params.ticker as string
  const [stock, setStock] = useState<StockDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStockDetail = async () => {
      if (!ticker) return

      setLoading(true)
      setError(null)

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
        const response = await fetch(`${apiUrl}/stocks/${ticker}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch stock data: ${response.statusText}`)
        }

        const data: StockDetail = await response.json()
        setStock(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchStockDetail()
  }, [ticker])

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container py-12">
          <div className="border-4 border-destructive bg-card p-12 text-center">
            <div className="h-12 w-12 bg-destructive mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4 uppercase tracking-wide">Error Loading Stock</h1>
            <p className="font-mono text-destructive">{error}</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container py-8 md:py-12">
        {/* Stock Header */}
        <section className="mb-8" style={{ animation: "slideIn 0.5s ease-out" }}>
          {loading ? (
            <div className="border-4 border-border bg-card p-6 md:p-8">
              <div className="animate-pulse">
                <div className="h-8 w-48 bg-muted mb-4" />
                <div className="h-6 w-96 bg-muted/50" />
              </div>
            </div>
          ) : stock ? (
            <div className="border-4 border-border bg-card p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-4 mb-3">
                    <h1 className="text-4xl md:text-5xl font-bold font-mono tracking-tight">
                      {stock.ticker}
                    </h1>
                    {stock.latest_score && (
                      <span className={`px-4 py-2 font-bold font-mono text-lg ${gradeColors[stock.latest_score.grade] || "bg-muted text-muted-foreground"}`}>
                        {stock.latest_score.grade}
                      </span>
                    )}
                  </div>
                  <p className="text-xl text-muted-foreground">{stock.name}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="font-mono uppercase">{stock.market}</span>
                    </div>
                    {stock.sector && (
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        <span className="font-mono">{stock.sector}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {stock.latest_score && (
                  <div className="text-left md:text-right">
                    <div className="text-sm uppercase font-semibold text-muted-foreground mb-1 tracking-wide">
                      Total Score
                    </div>
                    <div className="text-5xl md:text-6xl font-bold font-mono tabular-nums text-accent">
                      {stock.latest_score.total_score}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      out of 100
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </section>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Chart & Radar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Chart */}
            <section style={{ animation: "slideIn 0.5s ease-out 0.1s backwards" }}>
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-5 w-5 text-accent" />
                <h2 className="text-xl font-bold uppercase tracking-wide">Price History</h2>
              </div>
              <Card className="rounded-none border-4 border-border overflow-hidden">
                <div className="h-[400px] md:h-[500px]">
                  <StockChart ticker={ticker} />
                </div>
              </Card>
            </section>

            {/* Radar Chart */}
            <section style={{ animation: "slideIn 0.5s ease-out 0.2s backwards" }}>
              <div className="flex items-center gap-3 mb-4">
                <Activity className="h-5 w-5 text-accent" />
                <h2 className="text-xl font-bold uppercase tracking-wide">Factor Analysis</h2>
              </div>
              <Card className="rounded-none border-4 border-border p-6 md:p-8">
                {loading ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="inline-flex gap-1 mb-4">
                        <div className="h-3 w-3 bg-accent animate-pulse" style={{ animationDelay: "0ms" }} />
                        <div className="h-3 w-3 bg-accent animate-pulse" style={{ animationDelay: "150ms" }} />
                        <div className="h-3 w-3 bg-accent animate-pulse" style={{ animationDelay: "300ms" }} />
                      </div>
                      <p className="font-mono text-sm text-muted-foreground uppercase tracking-wider">
                        Loading Analysis
                      </p>
                    </div>
                  </div>
                ) : stock?.latest_score ? (
                  <StockRadarChart scores={stock.latest_score} />
                ) : (
                  <div className="h-[400px] flex items-center justify-center border-2 border-dashed border-border">
                    <p className="text-muted-foreground font-mono">No score data available</p>
                  </div>
                )}
              </Card>
            </section>
          </div>

          {/* Right Column - Financials & Actions */}
          <div className="space-y-6">
            {/* Watchlist Button */}
            <section style={{ animation: "slideIn 0.5s ease-out 0.15s backwards" }}>
              <WatchlistButton ticker={ticker} />
            </section>

            {/* Financial Summary */}
            <section style={{ animation: "slideIn 0.5s ease-out 0.25s backwards" }}>
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="h-5 w-5 text-accent" />
                <h2 className="text-xl font-bold uppercase tracking-wide">Financials</h2>
              </div>
              <Card className="rounded-none border-4 border-border">
                {loading ? (
                  <div className="p-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-muted/50 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                    ))}
                  </div>
                ) : stock?.latest_financials ? (
                  <FinancialSummary financials={stock.latest_financials} />
                ) : (
                  <div className="p-12 text-center border-2 border-dashed border-border m-6">
                    <p className="text-muted-foreground font-mono">No financial data available</p>
                  </div>
                )}
              </Card>
            </section>

            {/* Score Breakdown */}
            {stock?.latest_score && (
              <section style={{ animation: "slideIn 0.5s ease-out 0.3s backwards" }}>
                <Card className="rounded-none border-4 border-border p-6">
                  <h3 className="font-bold uppercase tracking-wide mb-4 text-sm text-muted-foreground">
                    Score Breakdown
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: "Valuation", score: stock.latest_score.valuation_score, color: "bg-chart-1" },
                      { label: "Profitability", score: stock.latest_score.profitability_score, color: "bg-chart-2" },
                      { label: "Growth", score: stock.latest_score.growth_score, color: "bg-chart-3" },
                      { label: "Momentum", score: stock.latest_score.momentum_score, color: "bg-chart-4" },
                      { label: "Revision", score: stock.latest_score.revision_score, color: "bg-chart-5" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 ${item.color}`} />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        <span className="font-mono font-bold tabular-nums">{item.score}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </section>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
