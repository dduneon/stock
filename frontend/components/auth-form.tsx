"use client"

import { useState, FormEvent } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Eye, EyeOff } from "lucide-react"

interface AuthFormProps {
  type: "login" | "register"
  onSubmit: (data: { username?: string; email: string; password: string }) => Promise<void>
  isLoading: boolean
  error: string | null
}

export function AuthForm({ type, onSubmit, isLoading, error }: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errors: Record<string, string> = {}

    if (type === "register" && !formData.username.trim()) {
      errors.username = "USERNAME IS REQUIRED"
    }

    if (!formData.email.trim()) {
      errors.email = "EMAIL IS REQUIRED"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "INVALID EMAIL FORMAT"
    }

    if (!formData.password) {
      errors.password = "PASSWORD IS REQUIRED"
    } else if (formData.password.length < 6) {
      errors.password = "PASSWORD MUST BE AT LEAST 6 CHARACTERS"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    const submitData = type === "register" 
      ? { username: formData.username, email: formData.email, password: formData.password }
      : { email: formData.email, password: formData.password }
    
    await onSubmit(submitData)
  }

  const isLogin = type === "login"

  return (
    <Card className="w-full max-w-md border-4 border-border rounded-none shadow-[8px_8px_0px_0px_hsl(var(--border))]">
      <CardHeader className="space-y-2 border-b-4 border-border pb-6">
        <CardTitle className="text-2xl font-bold uppercase tracking-tight">
          {isLogin ? "Sign In" : "Create Account"}
        </CardTitle>
        <CardDescription className="font-mono text-sm">
          {isLogin 
            ? "Enter your credentials to access your watchlist" 
            : "Sign up to start tracking your favorite stocks"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="space-y-2">
              <label 
                htmlFor="username" 
                className="text-xs font-bold uppercase tracking-wider"
              >
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={isLoading}
                className="rounded-none border-2 border-border h-12 text-base focus-visible:ring-accent focus-visible:border-accent"
                placeholder="Enter your username"
              />
              {validationErrors.username && (
                <p className="text-xs font-mono text-destructive uppercase">
                  {validationErrors.username}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label 
              htmlFor="email" 
              className="text-xs font-bold uppercase tracking-wider"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isLoading}
              className="rounded-none border-2 border-border h-12 text-base focus-visible:ring-accent focus-visible:border-accent"
              placeholder="Enter your email"
            />
            {validationErrors.email && (
              <p className="text-xs font-mono text-destructive uppercase">
                {validationErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label 
              htmlFor="password" 
              className="text-xs font-bold uppercase tracking-wider"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isLoading}
                className="rounded-none border-2 border-border h-12 text-base pr-12 focus-visible:ring-accent focus-visible:border-accent"
                placeholder="Enter your password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-12 w-12 rounded-none hover:bg-accent hover:text-accent-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </Button>
            </div>
            {validationErrors.password && (
              <p className="text-xs font-mono text-destructive uppercase">
                {validationErrors.password}
              </p>
            )}
          </div>

          {error && (
            <div className="border-2 border-destructive bg-destructive/10 p-4">
              <p className="text-sm font-mono text-destructive text-center uppercase">
                {error}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-none border-4 border-border h-14 text-lg font-bold uppercase tracking-wide bg-accent text-accent-foreground hover:bg-accent/90 hover:border-accent transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              isLogin ? "Sign In" : "Create Account"
            )}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t-2 border-border text-center">
          <p className="text-sm text-muted-foreground font-mono">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <Link 
              href={isLogin ? "/register" : "/login"}
              className="font-bold text-accent hover:underline uppercase"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
