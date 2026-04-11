import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

const publicPrefixes = [
  "/login",
  "/register",
  "/password-reset",
  "/vertragstypen",
  "/loesungen/einkauf",
  "/produkt",
  "/preise",
  "/loesungen",
  "/integrationen",
  "/trust-center",
  "/sicherheit-compliance",
  "/ki-transparenz",
  "/hilfe",
  "/support",
  "/systemstatus",
  "/release-notes",
  "/datenschutz",
  "/impressum",
  "/avv",
  "/enterprise-kontakt",
  "/api/auth",
  "/api/scim",
  "/api/health",
  "/api/admin/status",
  "/api/admin/seed",
  "/api/contact",
  "/api/stripe/webhook",
]

const adminOnlyPrefixes = [
  "/dashboard/admin",
  "/api/admin/provision-demo",
]

function isPublic(pathname: string): boolean {
  if (pathname === "/") return true
  return publicPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function isAdminOnly(pathname: string): boolean {
  return adminOnlyPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Skip static assets
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico" || pathname.endsWith(".svg") || pathname.endsWith(".ico")) {
    return NextResponse.next()
  }

  // Public routes — no auth needed
  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  // All other routes require auth
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin-only routes — require ADMIN role
  if (isAdminOnly(pathname)) {
    const role = (req.auth.user as { role?: string } | undefined)?.role
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
}
