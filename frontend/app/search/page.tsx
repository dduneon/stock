"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, TrendingUp, ArrowRight } from "lucide-react"

type SearchResult = {
  ticker: string
  name: string
  sector: string
  market: string
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    setHasSearched(true)

    try {
      const response = await fetch(`${apiUrl}/search?q=${encodeURIComponent(searchQuery)}`)
      
      if (!response.ok) {
        throw new Error("Search failed")
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      console.error("Search error:", err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [initialQuery, performSearch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
      performSearch(query)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-tight mb-4">
              Stock <span className="text-accent">Search</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-mono">
              Find stocks by ticker symbol or company name
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter ticker or company name..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value.toUpperCase())}
                  className="h-14 pl-12 pr-4 text-lg rounded-none border-4 border-border focus:border-accent font-mono"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || query.length < 2}
                className="h-14 px-8 rounded-none border-4 border-border bg-accent text-accent-foreground font-bold uppercase tracking-wide hover:bg-accent/90 hover:border-accent"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
              </Button>
            </div>
          </form>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-accent" />
            </div>
          ) : hasSearched && results.length === 0 ? (
            <div className="border-4 border-border bg-muted/30 p-12 text-center">
              <div className="inline-block h-16 w-16 bg-muted mb-6" />
              <h3 className="text-2xl font-bold mb-2">No Results Found</h3>
              <p className="text-muted-foreground">
                Try searching with a different ticker or company name
              </p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              <div className="mb-4 font-mono text-sm text-muted-foreground uppercase tracking-wide">
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </div>
              {results.map((stock) => (
                <div
                  key={stock.ticker}
                  className="border-4 border-border bg-card hover:border-accent transition-colors"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <Link
                            href={`/stock/${stock.ticker}`}
                            className="text-2xl font-bold uppercase tracking-tight hover:text-accent transition-colors"
                          >
                            {stock.ticker}
                          </Link>
                          <span className="px-2 py-1 text-xs font-mono uppercase border-2 border-border bg-muted">
                            {stock.market}
                          </span>
                        </div>
                        <h3 className="text-lg font-medium mb-1">
                          {stock.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono">
                          <span>{stock.sector || "Unknown sector"}</span>
                        </div>
                      </div>
                      
                      <Link href={`/stock/${stock.ticker}`}>
                        <Button
                          variant="outline"
                          className="rounded-none border-2 border-border h-12 px-6 font-semibold hover:border-accent hover:bg-accent/5"
                        >
                          View
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !hasSearched ? (
            <div className="border-4 border-border bg-muted/30 p-12 text-center">
              <div className="inline-block h-16 w-16 bg-accent/10 flex items-center justify-center mb-6">
                <TrendingUp className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Search for Stocks</h3>
              <p className="text-muted-foreground">
                Enter a ticker symbol (e.g., AAPL, TSLA) or company name to search
              </p>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
