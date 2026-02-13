"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { ArrowUpDown, TrendingUp, DollarSign, Zap, Target } from "lucide-react"

type Recommendation = {
  ticker: string
  name: string
  sector: string
  industry: string
  valuation_score: number
  profitability_score: number
  growth_score: number
  momentum_score: number
  total_score: number
  grade: string
  score_date: string
}

type SortField = 'ticker' | 'total_score' | 'valuation_score' | 'profitability_score' | 'growth_score' | 'momentum_score'
type SortDirection = 'asc' | 'desc'

const categories = [
  { id: 'top_picks', label: 'Top Picks', icon: Target, color: 'chart-1' },
  { id: 'undervalued', label: 'Undervalued', icon: DollarSign, color: 'chart-2' },
  { id: 'growth', label: 'Growth', icon: TrendingUp, color: 'chart-3' },
  { id: 'momentum', label: 'Momentum', icon: Zap, color: 'chart-4' },
]

const gradeColors: Record<string, string> = {
  'A+': 'bg-chart-1 text-background',
  'A': 'bg-chart-1/80 text-background',
  'B+': 'bg-chart-3 text-background',
  'B': 'bg-chart-3/80 text-background',
  'C+': 'bg-chart-2/60 text-background',
  'C': 'bg-chart-2/40 text-background',
  'D': 'bg-destructive/60 text-background',
  'F': 'bg-destructive text-background',
}

export default function RecommendationsPage() {
  const [activeCategory, setActiveCategory] = useState('top_picks')
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('total_score')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  useEffect(() => {
    fetchRecommendations(activeCategory)
  }, [activeCategory])

  const fetchRecommendations = async (category: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
      const response = await fetch(`${apiUrl}/recommendations?category=${category}&limit=30`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }
      
      const data = await response.json()
      setRecommendations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations')
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1
    const aVal = a[sortField]
    const bVal = b[sortField]
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return multiplier * aVal.localeCompare(bVal)
    }
    
    return multiplier * ((aVal as number) - (bVal as number))
  })

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container py-8 md:py-12">
        {/* Hero Section */}
        <div className="relative mb-12">
          <div className="absolute -top-6 -left-6 w-32 h-32 bg-accent/10 -z-10" />
          <div className="absolute -bottom-4 -right-4 w-24 h-24 border-4 border-border -z-10" />
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
            <span className="block">Stock</span>
            <span className="block text-accent">Recommendations</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            Algorithmically ranked stocks based on valuation, profitability, growth, and momentum metrics.
          </p>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-8">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-transparent h-auto p-0">
            {categories.map((cat, idx) => {
              const Icon = cat.icon
              return (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="rounded-none border-4 border-border h-auto py-4 px-6 data-[state=active]:border-accent data-[state=active]:bg-accent/10 transition-all hover:scale-[1.02] group"
                  style={{
                    animationDelay: `${idx * 50}ms`,
                  }}
                >
                  <div className="flex flex-col items-center gap-2 w-full">
                    <Icon className={`h-6 w-6 text-${cat.color} group-data-[state=active]:scale-110 transition-transform`} strokeWidth={2.5} />
                    <span className="font-bold text-sm md:text-base uppercase tracking-wide">{cat.label}</span>
                  </div>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {categories.map((cat) => (
            <TabsContent key={cat.id} value={cat.id} className="mt-0">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 bg-muted/50 border-2 border-border animate-pulse"
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
              ) : error ? (
                <div className="border-4 border-destructive bg-destructive/10 p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 bg-destructive" />
                    <h3 className="text-2xl font-bold">Error Loading Data</h3>
                  </div>
                  <p className="text-lg text-muted-foreground">{error}</p>
                  <Button
                    onClick={() => fetchRecommendations(activeCategory)}
                    className="mt-6 rounded-none border-2 border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Retry
                  </Button>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="border-4 border-border bg-muted/30 p-12 text-center">
                  <div className="inline-block h-16 w-16 bg-muted mb-6" />
                  <h3 className="text-2xl font-bold mb-2">No Data Available</h3>
                  <p className="text-muted-foreground">
                    No recommendations found for this category. Check back later.
                  </p>
                </div>
              ) : (
                <div className="border-4 border-border bg-card">
                  {/* Stats Bar */}
                  <div className="border-b-4 border-border p-4 md:p-6 bg-muted/30">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl md:text-4xl font-bold font-mono tabular-nums">
                          {recommendations.length}
                        </span>
                        <span className="text-sm md:text-base font-semibold text-muted-foreground uppercase tracking-wide">
                          Stocks Found
                        </span>
                      </div>
                      
                      {recommendations.length > 0 && (
                        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground font-mono">
                          <span>Last Updated:</span>
                          <span className="font-semibold">
                            {new Date(recommendations[0].score_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b-2 border-border hover:bg-transparent">
                          <TableHead className="font-bold uppercase tracking-wide">
                            <button
                              onClick={() => handleSort('ticker')}
                              className="flex items-center gap-2 hover:text-accent transition-colors"
                            >
                              Ticker
                              <ArrowUpDown className="h-4 w-4" />
                            </button>
                          </TableHead>
                          <TableHead className="font-bold uppercase tracking-wide hidden md:table-cell">Company</TableHead>
                          <TableHead className="font-bold uppercase tracking-wide hidden lg:table-cell">Sector</TableHead>
                          <TableHead className="font-bold uppercase tracking-wide text-right">
                            <button
                              onClick={() => handleSort('valuation_score')}
                              className="flex items-center gap-2 ml-auto hover:text-chart-2 transition-colors"
                            >
                              Val
                              <ArrowUpDown className="h-4 w-4" />
                            </button>
                          </TableHead>
                          <TableHead className="font-bold uppercase tracking-wide text-right">
                            <button
                              onClick={() => handleSort('profitability_score')}
                              className="flex items-center gap-2 ml-auto hover:text-chart-3 transition-colors"
                            >
                              Prof
                              <ArrowUpDown className="h-4 w-4" />
                            </button>
                          </TableHead>
                          <TableHead className="font-bold uppercase tracking-wide text-right hidden sm:table-cell">
                            <button
                              onClick={() => handleSort('growth_score')}
                              className="flex items-center gap-2 ml-auto hover:text-chart-3 transition-colors"
                            >
                              Growth
                              <ArrowUpDown className="h-4 w-4" />
                            </button>
                          </TableHead>
                          <TableHead className="font-bold uppercase tracking-wide text-right hidden sm:table-cell">
                            <button
                              onClick={() => handleSort('momentum_score')}
                              className="flex items-center gap-2 ml-auto hover:text-chart-4 transition-colors"
                            >
                              Mom
                              <ArrowUpDown className="h-4 w-4" />
                            </button>
                          </TableHead>
                          <TableHead className="font-bold uppercase tracking-wide text-right">
                            <button
                              onClick={() => handleSort('total_score')}
                              className="flex items-center gap-2 ml-auto hover:text-accent transition-colors"
                            >
                              Total
                              <ArrowUpDown className="h-4 w-4" />
                            </button>
                          </TableHead>
                          <TableHead className="font-bold uppercase tracking-wide text-center">Grade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedRecommendations.map((stock, idx) => (
                          <TableRow
                            key={stock.ticker}
                            className="border-b border-border hover:bg-accent/5 transition-colors group"
                            style={{
                              animation: 'fadeIn 0.3s ease-out',
                              animationDelay: `${idx * 30}ms`,
                              animationFillMode: 'backwards',
                            }}
                          >
                            <TableCell className="font-mono font-bold">
                              <Link
                                href={`/stock/${stock.ticker}`}
                                className="hover:text-accent transition-colors underline decoration-2 decoration-accent/0 hover:decoration-accent/100 underline-offset-4"
                              >
                                {stock.ticker}
                              </Link>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <span className="line-clamp-1">{stock.name}</span>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                              {stock.sector || '—'}
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums font-semibold">
                              {stock.valuation_score}
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums font-semibold">
                              {stock.profitability_score}
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums font-semibold hidden sm:table-cell">
                              {stock.growth_score}
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums font-semibold hidden sm:table-cell">
                              {stock.momentum_score}
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums font-bold text-lg">
                              {stock.total_score}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`inline-block px-3 py-1 font-bold font-mono text-sm ${gradeColors[stock.grade] || 'bg-muted text-muted-foreground'}`}>
                                {stock.grade}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
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
