import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"

/**
 * Tenant-IDs müssen unserem internen Format entsprechen:
 * - cuid (z.B. "cmn9kf3v20000rfcs09lv5ytg") — 25 Zeichen, alphanumerisch
 * - oder UUID-v4 (z.B. "15928e81-b3f6-48cb-a31e-cd19ac61e2c4") — 36 Zeichen
 *
 * Diese Validierung verhindert SQL-Injection-Versuche per Tenant-ID
 * und fängt fehlerhaft propagierte Strings (z.B. "null", "undefined") ab.
 */
const TENANT_ID_PATTERN = /^[a-z0-9-]{20,40}$/i

/**
 * Setzt den Tenant-Context für eine Transaktion und führt fn darin aus.
 *
 * - set_config(..., true) bindet die Variable an die LAUFENDE Transaktion;
 *   nach Commit/Rollback ist sie automatisch weg (kein Leak in Connection-Pool).
 * - Anschließender SELECT verifiziert, dass die Variable wirklich gesetzt
 *   wurde — catched Korruptionsfälle (z.B. wenn ein Replay-Pool einen
 *   Connection-Reset zwischen Statements hatte).
 * - Bei aktivem RLS (siehe Migration 20260424180000_enterprise_rls_policies)
 *   greift hier die Mandantentrennung auf DB-Ebene.
 */
export async function withTenant<T>(tenantId: string, fn: (tx: typeof prisma) => Promise<T>): Promise<T> {
  if (!tenantId || typeof tenantId !== "string") {
    throw new Error("withTenant: tenantId is required and must be a string")
  }

  if (!TENANT_ID_PATTERN.test(tenantId)) {
    // Defense-in-Depth: auch wenn set_config-Parameterisierung sicher ist
    // (Prisma escaped automatisch), wollen wir keine "kreativen" IDs akzeptieren.
    throw new Error("withTenant: tenantId failed format validation")
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`select set_config('app.tenant_id', ${tenantId}, true)`)

    // Self-Test: lese die Variable zurück und verifiziere den Wert.
    // Bei aktivem RLS ist das die einzige Stelle, an der wir vor der
    // ersten Query bemerken würden, wenn der Setting-Mechanismus bricht.
    const verify = await tx.$queryRaw<Array<{ tenant_id: string | null }>>(
      Prisma.sql`select current_setting('app.tenant_id', true) as tenant_id`
    )
    const set = verify[0]?.tenant_id
    if (set !== tenantId) {
      throw new Error(
        `withTenant: tenant context could not be activated (expected ${tenantId}, got ${set ?? "NULL"})`
      )
    }

    return fn(tx as typeof prisma)
  })
}
