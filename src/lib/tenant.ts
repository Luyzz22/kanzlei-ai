import { auth } from "@/lib/auth"
import { Prisma } from "@prisma/client"
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
 *
 * SECURITY: Uses Prisma.sql tagged template (parameterized) instead of
 * $executeRawUnsafe to prevent SQL injection (Audit finding).
 */
export async function setRlsTenantId(tenantId: string): Promise<void> {
  // Validate tenantId format (CUID) before any SQL
  if (!/^c[a-z0-9]{24,}$/i.test(tenantId) && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) {
    throw new Error("Invalid tenantId format — potential injection attempt")
  }
  await prisma.$executeRaw(Prisma.sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`)
}
