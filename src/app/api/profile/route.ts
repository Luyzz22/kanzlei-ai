export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        password: false,
        image: true,
        externalId: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 })
    }

    // Resolve tenant context
    const tenantContext = await resolveTenantContextForUser(user.id)
    let tenantName: string | null = null
    let tenantSlug: string | null = null
    let tenantRole: string | null = null

    if (tenantContext.status === "single") {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantContext.tenantId },
        select: { name: true, slug: true }
      })
      tenantName = tenant?.name ?? null
      tenantSlug = tenant?.slug ?? null

      const membership = await prisma.tenantMember.findFirst({
        where: { tenantId: tenantContext.tenantId, userId: user.id },
        select: { role: true }
      })
      tenantRole = membership?.role ?? null
    }

    // Has password (for showing/hiding password change section)
    const hasPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true }
    })
    const usesPasswordAuth = Boolean(hasPassword?.password)

    // SSO provider detection
    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      select: { provider: true }
    })
    const ssoProvider = accounts.find(a => a.provider === "microsoft-entra-id")
      ? "Microsoft Entra ID"
      : accounts.find(a => a.provider === "google")
        ? "Google"
        : null

    return NextResponse.json({
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        emailVerified: user.emailVerified?.toISOString() ?? null,
        externalId: user.externalId,
        tenantName,
        tenantSlug,
        tenantRole,
        usesPasswordAuth,
        ssoProvider
      }
    })
  } catch (error) {
    console.error("[profile.get] Error:", error)
    return NextResponse.json({ error: "Profil konnte nicht geladen werden." }, { status: 500 })
  }
}
