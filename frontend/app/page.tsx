import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { FeatureGrid } from "@/components/feature-grid"

export default function Home() {
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
    </div>
  )
}
