"use client"

import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { FeatureGrid } from "@/components/feature-grid"
import { useState, useEffect } from "react"
import { ArrowRight } from "lucide-react"

type TopPick = {
  ticker: string
  name: string
  total_score: number
  grade: string
}

const gradeColors: Record<string, string> = {
  'A+': 'bg-chart-1 text-background',
  'A': 'bg-chart-1/80 text-background',
  'B+': 'bg-chart-3 text-background',
  'B': 'bg-chart-3/80 text-background',
  'C+': 'bg-chart-2/60 text-background',
  'C': 'bg-chart-2/40 text-background',
}

export default function Home() {
  const [topPicks, setTopPicks] = useState<TopPick[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopPicks = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
        const response = await fetch(`${apiUrl}/recommendations?category=top_picks&limit=5`)
        
        if (response.ok) {
          const data = await response.json()
          setTopPicks(data)
        }
      } catch (err) {
        console.error('Failed to fetch top picks:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTopPicks()
  }, [])

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container py-12 md:py-20">
        <section className="grid gap-8 md:gap-12 mb-16">
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-accent/10 -z-10" />
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 relative">
              <span className="block">Data-Driven</span>
              <span className="block text-accent">Stock Analysis</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed">
              AI-powered insights for Korean and US markets. Make informed investment decisions with real-time data, fundamental analysis, and algorithmic scoring.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link href="/recommendations">
              <Button size="lg" className="rounded-none border-2 border-accent bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8 h-14 text-lg">
                View Recommendations
              </Button>
            </Link>
            <Link href="/search">
              <Button size="lg" variant="outline" className="rounded-none border-2 font-bold px-8 h-14 text-lg">
                Search Stocks
              </Button>
            </Link>
          </div>
        </section>

        {/* Top Picks Preview */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Top Picks <span className="text-accent">Today</span>
            </h2>
            <Link href="/recommendations">
              <Button variant="outline" className="rounded-none border-2 font-semibold group">
                View All
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-muted/50 border-2 border-border animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          ) : topPicks.length > 0 ? (
            <div className="border-4 border-border bg-card">
              {topPicks.map((stock, idx) => (
                <Link
                  key={stock.ticker}
                  href={`/stock/${stock.ticker}`}
                  className="flex items-center justify-between p-4 md:p-6 border-b-2 last:border-b-0 border-border hover:bg-accent/5 transition-all group"
                  style={{
                    animation: 'slideIn 0.4s ease-out',
                    animationDelay: `${idx * 80}ms`,
                    animationFillMode: 'backwards',
                  }}
                >
                  <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                    <div className="h-10 w-10 md:h-12 md:w-12 bg-accent/20 flex items-center justify-center font-mono font-bold text-lg md:text-xl flex-shrink-0 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-bold text-lg md:text-xl mb-1 group-hover:text-accent transition-colors">
                        {stock.ticker}
                      </div>
                      <div className="text-sm md:text-base text-muted-foreground line-clamp-1">
                        {stock.name}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs uppercase font-semibold text-muted-foreground mb-1 tracking-wide">
                        Score
                      </div>
                      <div className="font-mono font-bold text-xl md:text-2xl tabular-nums">
                        {stock.total_score}
                      </div>
                    </div>
                    <span className={`px-3 md:px-4 py-2 font-bold font-mono text-sm md:text-base ${gradeColors[stock.grade] || 'bg-muted text-muted-foreground'}`}>
                      {stock.grade}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        <FeatureGrid />

        <section className="border-t-4 border-border pt-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 tracking-tight">
                Built for Serious Investors
              </h2>
              <ul className="space-y-4 text-lg">
                {[
                  "Percentile-based sector comparisons",
                  "Weighted scoring across 4 key dimensions",
                  "Historical price and fundamental tracking",
                  "KOSPI, KOSDAQ, and S&P 500 coverage",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 group">
                    <div className="h-6 w-6 bg-accent mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <Card className="rounded-none border-4 border-border bg-muted/50 p-8">
              <div className="space-y-6">
                <div className="flex items-baseline gap-3">
                  <div className="h-2 w-2 bg-chart-1" />
                  <span className="text-sm font-mono font-semibold">VALUATION</span>
                  <span className="ml-auto font-mono tabular-nums">30%</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <div className="h-2 w-2 bg-chart-2" />
                  <span className="text-sm font-mono font-semibold">PROFITABILITY</span>
                  <span className="ml-auto font-mono tabular-nums">25%</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <div className="h-2 w-2 bg-chart-3" />
                  <span className="text-sm font-mono font-semibold">GROWTH</span>
                  <span className="ml-auto font-mono tabular-nums">25%</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <div className="h-2 w-2 bg-chart-4" />
                  <span className="text-sm font-mono font-semibold">MOMENTUM</span>
                  <span className="ml-auto font-mono tabular-nums">20%</span>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
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
