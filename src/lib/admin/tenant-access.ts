import "server-only"

import { prisma } from "@/lib/prisma"

export async function resolveSingleTenantIdForUser(userId: string): Promise<string | null> {
  const memberships = await prisma.tenantMember.findMany({
    where: { userId },
    select: { tenantId: true },
    distinct: ["tenantId"],
    take: 2
  })

  if (memberships.length !== 1) {
    return null
  }

  return memberships[0]?.tenantId ?? null
}
