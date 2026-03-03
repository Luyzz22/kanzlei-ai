import { prisma } from "@/lib/prisma"

export async function requireScimTenant() {
  const slug = process.env.SCIM_TENANT_SLUG
  if (!slug) return { ok: false as const, status: 500, error: "SCIM_TENANT_SLUG not configured" }

  const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true, slug: true } })
  if (!tenant) return { ok: false as const, status: 404, error: `Tenant not found for slug=${slug}` }

  return { ok: true as const, tenant }
}
