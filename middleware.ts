import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

export default auth((request) => {
  if (!request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.next()
  }

  const session = request.auth

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (!session.user.tenantId) {
    return NextResponse.redirect(new URL("/login?error=tenant_missing", request.url))
  }

  // TODO: Subdomain-Routing ergänzen (z.B. <kanzlei>.kanzlei-ai.de -> tenantId-Auflösung).
  return NextResponse.next()
})

export const config = {
  matcher: ["/dashboard/:path*"]
}
