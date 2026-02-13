"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { Moon, Sun, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <nav className="sticky top-0 z-50 w-full border-b-4 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-3 font-bold text-xl tracking-tight transition-all hover:scale-105"
        >
          <div className="relative">
            <TrendingUp className="h-7 w-7 text-accent" strokeWidth={2.5} />
            <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-accent" />
          </div>
          <span className="font-mono uppercase">StockAnalysis</span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-1 border-2 border-border">
            <Link href="/">
              <Button variant="ghost" className="rounded-none border-r-2 border-border font-semibold">
                Dashboard
              </Button>
            </Link>
            <Link href="/recommendations">
              <Button variant="ghost" className="rounded-none border-r-2 border-border font-semibold">
                Recommendations
              </Button>
            </Link>
            <Link href="/search">
              <Button variant="ghost" className="rounded-none font-semibold">
                Search
              </Button>
            </Link>
          </div>

          {mounted && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-none border-2 border-border transition-all hover:bg-accent hover:text-accent-foreground hover:border-accent"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" strokeWidth={2.5} />
              ) : (
                <Moon className="h-5 w-5" strokeWidth={2.5} />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
