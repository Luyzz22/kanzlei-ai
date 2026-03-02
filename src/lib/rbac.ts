import { Role } from "@prisma/client"

const roleHierarchy: Record<Role, number> = {
  ASSISTENT: 1,
  ANWALT: 2,
  ADMIN: 3
}

export function hasMinimumRole(userRole: Role, requiredRole: Role) {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}
