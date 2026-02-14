"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react"

interface WatchlistButtonProps {
  ticker: string
}

export function WatchlistButton({ ticker }: WatchlistButtonProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkWatchlistStatus = async () => {
      if (!ticker) return
      
      setChecking(true)
      setError(null)
      
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
        const response = await fetch(`${apiUrl}/watchlist`, {
          credentials: "include",
        })
        
        if (response.ok) {
          const data = await response.json()
          const tickers = data.map((item: { ticker: string }) => item.ticker)
          setIsInWatchlist(tickers.includes(ticker))
        }
      } catch (err) {
        console.error("Failed to check watchlist status:", err)
      } finally {
        setChecking(false)
      }
    }

    checkWatchlistStatus()
  }, [ticker])

  const handleToggleWatchlist = async () => {
    if (!ticker) return
    
    setLoading(true)
    setError(null)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
      
      if (isInWatchlist) {
        const response = await fetch(`${apiUrl}/watchlist/${ticker}`, {
          method: "DELETE",
          credentials: "include",
        })
        
        if (!response.ok) {
          throw new Error("Failed to remove from watchlist")
        }
        
        setIsInWatchlist(false)
      } else {
        const response = await fetch(`${apiUrl}/watchlist`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ ticker }),
        })
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Please sign in to add to watchlist")
          }
          throw new Error("Failed to add to watchlist")
        }
        
        setIsInWatchlist(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <Button
        variant="outline"
        disabled
        className="w-full rounded-none border-4 border-border h-16 text-lg font-bold"
      >
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Checking...
      </Button>
    )
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleToggleWatchlist}
        disabled={loading}
        variant={isInWatchlist ? "default" : "outline"}
        className={`w-full rounded-none border-4 h-16 text-lg font-bold transition-all ${
          isInWatchlist
            ? "border-accent bg-accent text-accent-foreground hover:bg-accent/90"
            : "border-border hover:border-accent hover:bg-accent/5"
        }`}
      >
        {loading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : isInWatchlist ? (
          <BookmarkCheck className="mr-2 h-5 w-5" />
        ) : (
          <Bookmark className="mr-2 h-5 w-5" />
        )}
        {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
      </Button>
      
      {error && (
        <div className="border-2 border-destructive bg-destructive/10 p-3 text-center">
          <p className="text-sm font-mono text-destructive">{error}</p>
        </div>
      )}
    </div>
  )
}
