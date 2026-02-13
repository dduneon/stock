"use client"

import { useEffect, useRef, useState } from "react"
import { createChart, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries } from "lightweight-charts"

interface StockChartProps {
  ticker: string
}

interface PriceData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export function StockChart({ ticker }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const candlestickSeriesRef = useRef<any>(null)
  const volumeSeriesRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    // Create chart with brutalist dark theme
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "oklch(0.98 0 0)",
        fontFamily: "IBM Plex Mono, monospace",
      },
      grid: {
        vertLines: { color: "oklch(0.28 0 0)", style: 1 },
        horzLines: { color: "oklch(0.28 0 0)", style: 1 },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "oklch(0.75 0.24 142)",
          width: 1,
          style: 3,
          labelBackgroundColor: "oklch(0.75 0.24 142)",
        },
        horzLine: {
          color: "oklch(0.75 0.24 142)",
          width: 1,
          style: 3,
          labelBackgroundColor: "oklch(0.75 0.24 142)",
        },
      },
      rightPriceScale: {
        borderColor: "oklch(0.28 0 0)",
        scaleMargins: {
          top: 0.1,
          bottom: 0.3,
        },
      },
      timeScale: {
        borderColor: "oklch(0.28 0 0)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    })

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "oklch(0.75 0.24 142)",
      downColor: "oklch(0.65 0.22 25)",
      borderUpColor: "oklch(0.75 0.24 142)",
      borderDownColor: "oklch(0.65 0.22 25)",
      wickUpColor: "oklch(0.75 0.24 142)",
      wickDownColor: "oklch(0.65 0.22 25)",
    })

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "oklch(0.62 0 0 / 0.5)",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "",
    })

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    })

    chartRef.current = chart
    candlestickSeriesRef.current = candlestickSeries
    volumeSeriesRef.current = volumeSeries

    // Responsive resize handler
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        })
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => {
      window.removeEventListener("resize", handleResize)
      chart.remove()
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!ticker || !candlestickSeriesRef.current || !volumeSeriesRef.current) return

      setLoading(true)
      setError(null)

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        const response = await fetch(`${apiUrl}/stocks/${ticker}/prices`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch price data: ${response.statusText}`)
        }

        const data: PriceData[] = await response.json()

        if (!data || data.length === 0) {
          throw new Error("No price data available")
        }

        // Transform data for lightweight-charts
        const candlestickData = data.map(item => ({
          time: item.date,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        }))

        const volumeData = data.map(item => ({
          time: item.date,
          value: item.volume,
          color: item.close >= item.open 
            ? "oklch(0.75 0.24 142 / 0.5)" 
            : "oklch(0.65 0.22 25 / 0.5)",
        }))

        candlestickSeriesRef.current.setData(candlestickData)
        volumeSeriesRef.current.setData(volumeData)

        // Fit content to viewport
        chartRef.current?.timeScale().fitContent()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [ticker])

  if (error) {
    return (
      <div className="relative w-full h-full min-h-[400px] border-4 border-destructive bg-card flex items-center justify-center">
        <div className="text-center p-8">
          <div className="h-8 w-8 bg-destructive mx-auto mb-4" />
          <p className="font-mono text-sm text-destructive uppercase tracking-wider">
            ERROR: {error}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {loading && (
        <div className="absolute inset-0 z-10 border-4 border-border bg-card flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex gap-1 mb-4">
              <div className="h-3 w-3 bg-accent animate-pulse" style={{ animationDelay: "0ms" }} />
              <div className="h-3 w-3 bg-accent animate-pulse" style={{ animationDelay: "150ms" }} />
              <div className="h-3 w-3 bg-accent animate-pulse" style={{ animationDelay: "300ms" }} />
            </div>
            <p className="font-mono text-sm text-muted-foreground uppercase tracking-wider">
              Loading {ticker}
            </p>
          </div>
        </div>
      )}
      <div 
        ref={chartContainerRef} 
        className="w-full h-full border-4 border-border bg-card"
        style={{ minHeight: "400px" }}
      />
      <div className="absolute top-0 left-0 right-0 border-b-2 border-border bg-card/95 backdrop-blur-sm p-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 bg-accent" />
          <span className="font-mono font-bold text-lg tracking-tight">{ticker}</span>
        </div>
        <div className="flex gap-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-chart-1" />
            <span>OHLC</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-muted" />
            <span>Volume</span>
          </div>
        </div>
      </div>
    </div>
  )
}
