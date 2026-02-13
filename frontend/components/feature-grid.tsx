"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, BarChart3, Target, Zap, LucideIcon } from "lucide-react"

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: TrendingUp,
    title: "Multi-Factor Scoring",
    description: "Combines valuation, profitability, growth, and momentum metrics",
  },
  {
    icon: BarChart3,
    title: "Real-Time Data",
    description: "Daily price updates and fundamental data from Korean and US markets",
  },
  {
    icon: Target,
    title: "Smart Recommendations",
    description: "Algorithmic strategies for undervalued, growth, and momentum plays",
  },
  {
    icon: Zap,
    title: "Instant Analysis",
    description: "Comprehensive stock profiles with historical performance metrics",
  },
]

export function FeatureGrid() {
  return (
    <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
      {features.map((feature, i) => (
        <Card 
          key={i} 
          className="rounded-none border-2 border-border bg-card transition-all hover:border-accent hover:shadow-lg group animate-in fade-in slide-in-from-bottom-4"
          style={{
            animationDelay: `${i * 100}ms`,
            animationFillMode: 'backwards',
          }}
        >
          <CardHeader>
            <feature.icon className="h-10 w-10 mb-3 text-accent group-hover:scale-110 transition-transform" strokeWidth={2} />
            <CardTitle className="text-lg font-bold">{feature.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base leading-relaxed">
              {feature.description}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
