import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"

export async function withTenant<T>(tenantId: string, fn: (tx: typeof prisma) => Promise<T>): Promise<T> {
  if (!tenantId) throw new Error("withTenant: tenantId is required")

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`select set_config('app.tenant_id', ${tenantId}, true)`)
    return fn(tx as typeof prisma)
  })
}
