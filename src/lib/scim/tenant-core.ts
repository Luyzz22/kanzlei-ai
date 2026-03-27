import { prisma } from "@/lib/prisma"

export async function requireScimTenant() {
  const slug = process.env.SCIM_TENANT_SLUG
  const hasToken = Boolean(process.env.SCIM_BEARER_TOKEN || process.env.SCIM_BEARER_TOKENS)
  if (!slug || !hasToken) {
    return { ok: false as const, status: 503, error: "SCIM provisioning is disabled" }
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true, slug: true } })
  if (!tenant) return { ok: false as const, status: 404, error: `Tenant not found for slug=${slug}` }

  return { ok: true as const, tenant }
}
