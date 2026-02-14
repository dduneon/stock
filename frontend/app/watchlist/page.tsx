"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Trash2, TrendingUp, ArrowRight } from "lucide-react"

interface WatchlistItem {
  id: number
  ticker: string
  stock: {
    name: string
    market: string
    sector: string
  }
  added_at: string
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export default function WatchlistPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
      return
    }

    if (isAuthenticated) {
      fetchWatchlist()
    }
  }, [isAuthenticated, authLoading, router])

  const fetchWatchlist = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${apiUrl}/watchlist`, {
        credentials: "include",
      })

      if (response.status === 401) {
        router.push("/login")
        return
      }

      if (!response.ok) {
        throw new Error("Failed to fetch watchlist")
      }

      const data = await response.json()
      setWatchlist(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load watchlist")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (ticker: string, id: number) => {
    setRemovingId(id)

    try {
      const response = await fetch(`${apiUrl}/watchlist/${ticker}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to remove from watchlist")
      }

      setWatchlist(watchlist.filter((item) => item.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove item")
    } finally {
      setRemovingId(null)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-12 w-12 animate-spin text-accent" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold uppercase tracking-tight mb-2">
              Your Watchlist
            </h1>
            <p className="text-muted-foreground font-mono">
              Track and manage your favorite stocks
            </p>
          </div>

          {error && (
            <div className="mb-6 border-2 border-destructive bg-destructive/10 p-4">
              <p className="text-sm font-mono text-destructive uppercase text-center">
                {error}
              </p>
            </div>
          )}

          {watchlist.length === 0 ? (
            <Card className="border-4 border-border rounded-none">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 border-4 border-border bg-accent/10 flex items-center justify-center mb-6">
                  <TrendingUp className="h-8 w-8 text-accent" />
                </div>
                <h2 className="text-2xl font-bold uppercase tracking-tight mb-2">
                  No Stocks Yet
                </h2>
                <p className="text-muted-foreground font-mono text-center mb-6 max-w-md">
                  Your watchlist is empty. Start adding stocks to track their performance.
                </p>
                <Link href="/recommendations">
                  <Button className="rounded-none border-4 border-border h-12 px-8 font-bold uppercase tracking-wide bg-accent text-accent-foreground hover:bg-accent/90 hover:border-accent transition-all">
                    Browse Recommendations
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {watchlist.map((item) => (
                <Card 
                  key={item.id} 
                  className="border-4 border-border rounded-none hover:border-accent transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <Link 
                            href={`/stock/${item.ticker}`}
                            className="text-2xl font-bold uppercase tracking-tight hover:text-accent transition-colors"
                          >
                            {item.ticker}
                          </Link>
                          <span className="px-2 py-1 text-xs font-mono uppercase border-2 border-border bg-muted">
                            {item.stock.market}
                          </span>
                        </div>
                        <h3 className="text-lg font-medium mb-1">
                          {item.stock.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono">
                          <span>{item.stock.sector}</span>
                          <span>•</span>
                          <span>
                            Added {new Date(item.added_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Link href={`/stock/${item.ticker}`}>
                          <Button
                            variant="outline"
                            className="rounded-none border-2 border-border h-12 px-6 font-semibold hover:border-accent hover:bg-accent/5"
                          >
                            View
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemove(item.ticker, item.id)}
                          disabled={removingId === item.id}
                          className="rounded-none border-2 border-border h-12 w-12 hover:border-destructive hover:bg-destructive/5 hover:text-destructive"
                        >
                          {removingId === item.id ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
