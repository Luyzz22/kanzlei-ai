import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

const publicRoutes = ["/login", "/register", "/password-reset"]

export default auth((req) => {
  const { nextUrl } = req
  const { pathname } = nextUrl

  const isApiAuthRoute = pathname.startsWith("/api/auth")
  const isNextRoute = pathname.startsWith("/_next")
  const isFavicon = pathname === "/favicon.ico"
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  if (isApiAuthRoute || isNextRoute || isFavicon || isPublicRoute) {
    return NextResponse.next()
  }

  if (!req.auth) {
    const loginUrl = new URL("/login", nextUrl)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
}
