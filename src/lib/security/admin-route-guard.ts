import "server-only"

import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { isProduction, sanitizeDiagnosticOutput } from "./diagnostic-utils"

/**
 * Central Admin Route Guard (DSGVO Art. 25/32, NIS2 Art. 21, ISO 27001 A.8)
 *
 * Provides reusable guards for admin and debug API routes:
 * - notFoundInProduction(): 404 for all production requests
 * - requireAdminApiAccess(): 401/403 if not ADMIN/OWNER
 * - requireNonProductionOrAdmin(): production → 404, non-prod → admin check
 * - sanitizeDiagnosticOutput(): strips secrets from diagnostic payloads (re-exported)
 */

export { isProduction, sanitizeDiagnosticOutput }

/** Returns 404 in production; null in non-production (caller may proceed). */
export function notFoundInProduction(): NextResponse | null {
  if (isProduction()) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 })
  }
  return null
}

export type AdminGuardApiResult =
  | { ok: true }
  | { ok: false; response: NextResponse }

/** Returns 401 if not authenticated, 403 if not ADMIN/OWNER; ok:true otherwise. */
export async function requireAdminApiAccess(): Promise<AdminGuardApiResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 }),
    }
  }
  const role = (session.user as { role?: string }).role
  if (role !== "ADMIN" && role !== "OWNER") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 }),
    }
  }
  return { ok: true }
}

/**
 * Combined guard: production → 404, non-production → admin check.
 * Returns NextResponse if access should be denied, null if access is granted.
 */
export async function requireNonProductionOrAdmin(): Promise<NextResponse | null> {
  if (isProduction()) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 })
  }
  const guard = await requireAdminApiAccess()
  return guard.ok ? null : guard.response
}
