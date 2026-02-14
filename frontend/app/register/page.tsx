"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AuthForm } from "@/components/auth-form"
import { Navbar } from "@/components/navbar"

export default function RegisterPage() {
  const router = useRouter()
  const { register, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isAuthenticated) {
    router.push("/watchlist")
    return null
  }

  const handleSubmit = async (data: { username?: string; email: string; password: string }) => {
    setIsLoading(true)
    setError(null)

    if (!data.username) {
      setError("Username is required")
      setIsLoading(false)
      return
    }

    const result = await register(data.username, data.email, data.password)

    if (result.success) {
      router.push("/watchlist")
    } else {
      setError(result.error || "Registration failed")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="w-full max-w-md">
            <AuthForm
              type="register"
              onSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
