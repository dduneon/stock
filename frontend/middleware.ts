import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value
  const { pathname } = request.nextUrl

  const protectedRoutes = ["/watchlist"]
  const authRoutes = ["/login", "/register"]

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && token) {
    const watchlistUrl = new URL("/watchlist", request.url)
    return NextResponse.redirect(watchlistUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/watchlist/:path*", "/login", "/register"],
}
