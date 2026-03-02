import { NextRequest } from "next/server"

import { handlers } from "@/lib/auth"
import { logAuditEvent } from "@/lib/audit"
import { prisma } from "@/lib/prisma"
import { resolveTenantId } from "@/lib/auth"

export const GET = handlers.GET

export async function POST(request: NextRequest) {
  const isCredentialsCallback = request.nextUrl.pathname.includes("/callback/credentials")
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined
  const userAgent = request.headers.get("user-agent") ?? undefined

  let credentials: { email?: string; tenantIdentifier?: string } = {}

  if (isCredentialsCallback) {
    try {
      const formData = await request.clone().formData()
      credentials = {
        email: formData.get("email")?.toString(),
        tenantIdentifier: formData.get("tenantIdentifier")?.toString()
      }
    } catch {
      // Nicht-blockierend: Audit-Logging bleibt defensiv, Auth-Flow läuft weiter.
    }
  }

  const response = await handlers.POST(request)

  if (!isCredentialsCallback) {
    return response
  }

  const location = response.headers.get("location") ?? ""
  const failedLogin = location.includes("error=CredentialsSignin")
  const tenantId = credentials.tenantIdentifier
    ? await resolveTenantId(credentials.tenantIdentifier)
    : undefined

  if (failedLogin) {
    await logAuditEvent({
      tenantId: tenantId ?? "unknown",
      action: "LOGIN_FAILED",
      resource: request.nextUrl.pathname,
      details: {
        reason: "Invalid credentials",
        email: credentials.email
      },
      ipAddress,
      userAgent
    })

    return response
  }

  if (tenantId && credentials.email) {
    const user = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email: credentials.email
        }
      },
      select: {
        id: true
      }
    })

    await logAuditEvent({
      tenantId,
      userId: user?.id,
      action: "LOGIN_SUCCESS",
      resource: request.nextUrl.pathname,
      details: {
        provider: "credentials"
      },
      ipAddress,
      userAgent
    })
  }

  return response
}
