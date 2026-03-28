import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

const publicPrefixes = [
  "/login",
  "/register",
  "/password-reset",
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
]

function isPublic(pathname: string): boolean {
  if (pathname === "/") return true
  return publicPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next()
  }

  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
}
