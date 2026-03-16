import "server-only"

import { Role, TenantRole } from "@prisma/client"

import { withTenant } from "@/lib/tenant-context.server"

export type TenantMemberListItem = {
  membershipId: string
  userId: string
  email: string
  name: string | null
  tenantRole: TenantRole
  platformRole: Role
  isActive: boolean
  joinedAt: string
}

export async function listTenantMembers(tenantId: string): Promise<TenantMemberListItem[]> {
  const members = await withTenant(tenantId, async (tx) => {
    return tx.tenantMember.findMany({
      where: { tenantId },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true
          }
        }
      }
    })
  })

  return members.map((member) => ({
    membershipId: member.id,
    userId: member.user.id,
    email: member.user.email,
    name: member.user.name,
    tenantRole: member.role,
    platformRole: member.user.role,
    isActive: member.user.isActive,
    joinedAt: member.createdAt.toISOString()
  }))
}
