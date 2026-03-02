import { Role } from "@prisma/client"

const roleHierarchy: Record<Role, number> = {
  ASSISTENT: 1,
  ANWALT: 2,
  ADMIN: 3
}

type TenantScopedRoleParams = {
  userRole: Role
  requiredRole: Role
  userTenantId?: string | null
  requiredTenantId?: string | null
}

export function hasMinimumRoleInTenant({
  userRole,
  requiredRole,
  userTenantId,
  requiredTenantId
}: TenantScopedRoleParams) {
  if (!userTenantId || !requiredTenantId) {
    return false
  }

  if (userTenantId !== requiredTenantId) {
    return false
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export function canAccessTenantResource(userTenantId?: string | null, resourceTenantId?: string | null) {
  if (!userTenantId || !resourceTenantId) {
    return false
  }

  return userTenantId === resourceTenantId
}
