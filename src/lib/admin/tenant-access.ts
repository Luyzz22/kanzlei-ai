import "server-only"

import { prisma } from "@/lib/prisma"

export type TenantContextResolution =
  | { status: "none" }
  | { status: "single"; tenantId: string }
  | { status: "multiple" }

export async function resolveTenantContextForUser(userId: string): Promise<TenantContextResolution> {
  const memberships = await prisma.tenantMember.findMany({
    where: { userId },
    select: { tenantId: true },
    distinct: ["tenantId"],
    take: 2
  })

  if (memberships.length === 0) {
    return { status: "none" }
  }

  if (memberships.length === 1 && memberships[0]?.tenantId) {
    return { status: "single", tenantId: memberships[0].tenantId }
  }

  return { status: "multiple" }
}
