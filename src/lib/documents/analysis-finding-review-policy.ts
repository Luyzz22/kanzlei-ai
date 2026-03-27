import { Role, TenantRole } from "@prisma/client"

/** Reine RBAC-Hilfe (ohne server-only) — für Tests und Server-Code nutzbar. */
export function canReviewContractAnalysisFindings(platformRole: Role, tenantRole: TenantRole): boolean {
  if (platformRole === Role.ADMIN || platformRole === Role.ANWALT) return true
  return tenantRole === TenantRole.OWNER || tenantRole === TenantRole.ADMIN
}
