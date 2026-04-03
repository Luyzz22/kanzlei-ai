import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export type TenantContext = {
  userId: string
  userEmail: string
  userName: string
  userRole: string
  tenantId: string
  tenantSlug: string
  tenantRole: string
}

/**
 * Resolves the current user's tenant context from the session.
 * Returns null if not authenticated or no tenant membership found.
 * 
 * Usage in API routes:
 * ```ts
 * const ctx = await getTenantContext()
 * if (!ctx) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
 * // ctx.tenantId is now available for all queries
 * ```
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  // Find first tenant membership for this user
  const membership = await prisma.tenantMember.findFirst({
    where: { userId: session.user.id },
    include: { tenant: { select: { id: true, slug: true } } },
    orderBy: { createdAt: "asc" }
  })

  if (!membership) return null

  return {
    userId: session.user.id,
    userEmail: session.user.email ?? "",
    userName: session.user.name ?? "",
    userRole: (session.user as { role?: string }).role ?? "ASSISTENT",
    tenantId: membership.tenant.id,
    tenantSlug: membership.tenant.slug,
    tenantRole: membership.role,
  }
}

/**
 * Requires ADMIN role. Returns context or null.
 */
export async function requireAdmin(): Promise<TenantContext | null> {
  const ctx = await getTenantContext()
  if (!ctx) return null
  if (ctx.userRole !== "ADMIN") return null
  return ctx
}

/**
 * Sets the RLS tenant context for raw SQL queries.
 * Call this before any $queryRaw or $executeRaw that touches tenant tables.
 */
export async function setRlsTenantId(tenantId: string): Promise<void> {
  await prisma.$executeRawUnsafe(`SET app.current_tenant_id = '${tenantId}'`)
}
