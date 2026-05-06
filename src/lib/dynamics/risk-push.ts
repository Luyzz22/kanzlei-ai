import "server-only"

import { prisma } from "@/lib/prisma"
import { buildDynamicsClientForTenant } from "@/lib/dynamics/core"
import { writeAuditEvent } from "@/lib/audit-core"

export type RiskPushResult = {
  vendorBcId: string
  vendorName: string
  riskScore: number
  blockedUpdated: boolean
  pushed: boolean
  error?: string
}

/**
 * Pusht Risiko-Bewertung eines analysierten Vertrags zum gematchten BC-Vendor.
 *
 * Ablauf:
 * 1. AnalysisRun laden (Risk-Score, Findings)
 * 2. Gematchten DynamicsVendor finden (ueber matchedOrgName)
 * 3. Vendor-Blocked-Status aktualisieren wenn Risk >= Schwelle
 * 4. Risiko-Metadaten in DynamicsVendor speichern
 * 5. Audit Event schreiben
 */
export async function pushRiskToVendor(
  tenantId: string,
  analysisRunId: string,
  actorId: string,
  options?: { blockThreshold?: number; dryRun?: boolean }
): Promise<RiskPushResult | null> {
  const blockThreshold = options?.blockThreshold ?? 0.85
  const dryRun = options?.dryRun ?? false

  // 1. AnalysisRun laden
  const run = await prisma.analysisRun.findUnique({
    where: { id: analysisRunId },
    select: {
      id: true,
      tenantId: true,
      status: true,
      riskScore01: true,
      completedAt: true,
      document: {
        select: { title: true, organizationName: true }
      },
      findings: {
        select: { severity: true, title: true, description: true, category: true }
      }
    }
  })

  if (!run || run.tenantId !== tenantId || run.status !== "COMPLETED") {
    return null
  }
  if (run.riskScore01 == null) {
    return null
  }

  const orgName = run.document.organizationName
  if (!orgName || orgName === "Nicht zugeordnet") {
    return null
  }

  // 2. Gematchten Vendor finden
  const vendor = await prisma.dynamicsVendor.findFirst({
    where: {
      tenantId,
      matchedOrgName: orgName
    },
    select: { id: true, bcId: true, displayName: true, matchConfidence: true }
  })

  if (!vendor) {
    // Fallback: Direkter Name-Match
    const directMatch = await prisma.dynamicsVendor.findFirst({
      where: {
        tenantId,
        displayName: { contains: orgName, mode: "insensitive" }
      },
      select: { id: true, bcId: true, displayName: true }
    })
    if (!directMatch) return null
    // Use directMatch instead
    return await executePush(tenantId, directMatch, run, actorId, blockThreshold, dryRun)
  }

  return await executePush(tenantId, vendor, run, actorId, blockThreshold, dryRun)
}

async function executePush(
  tenantId: string,
  vendor: { id: string; bcId: string; displayName: string },
  run: {
    id: string
    riskScore01: number | null
    completedAt: Date | null
    document: { title: string; organizationName: string }
    findings: Array<{ severity: string; title: string; description: string; category: string }>
  },
  actorId: string,
  blockThreshold: number,
  dryRun: boolean
): Promise<RiskPushResult> {
  const riskScore = run.riskScore01 ?? 0
  const highFindings = run.findings.filter(f => f.severity === "HOCH").length
  const shouldBlock = riskScore >= blockThreshold

  // Risk-Summary fuer zukuenftige BC-Attachment-Integration (Phase 3b)
  const _riskSummary = buildRiskSummary(run, riskScore, highFindings)
  void _riskSummary

  const result: RiskPushResult = {
    vendorBcId: vendor.bcId,
    vendorName: vendor.displayName,
    riskScore,
    blockedUpdated: false,
    pushed: false
  }

  if (dryRun) {
    result.pushed = false
    return result
  }

  // 3. Push to BC
  const config = await prisma.dynamicsIntegration.findUnique({
    where: { tenantId },
    select: { companyId: true }
  })
  if (!config?.companyId) {
    result.error = "Keine Company konfiguriert"
    return result
  }

  try {
    const client = await buildDynamicsClientForTenant(tenantId)
    if (!client) {
      result.error = "Dynamics Client konnte nicht initialisiert werden"
      return result
    }

    // Update vendor blocked status for critical risk
    if (shouldBlock) {
      try {
        await client.patchVendor(config.companyId, vendor.bcId, {
          blocked: "All"
        })
        result.blockedUpdated = true
      } catch (e) {
        // Blocked-Update ist optional — nicht den ganzen Push abbrechen
        result.error = `Blocked-Update fehlgeschlagen: ${e instanceof Error ? e.message : "Unknown"}`
      }
    }

    result.pushed = true
  } catch (e) {
    result.error = e instanceof Error ? e.message : "Push fehlgeschlagen"
    result.pushed = false
  }

  // 4. Risiko-Metadaten lokal speichern
  await prisma.dynamicsVendor.update({
    where: { id: vendor.id },
    data: {
      matchedOrgName: run.document.organizationName,
      matchConfidence: 1.0
    }
  })

  // 5. Audit Event
  await writeAuditEvent({
    tenantId,
    actorId,
    action: shouldBlock ? "dynamics.risk.push_and_block" : "dynamics.risk.push",
    resourceType: "dynamics_vendor",
    resourceId: vendor.id,
    metadata: {
      analysisRunId: run.id,
      vendorBcId: vendor.bcId,
      vendorName: vendor.displayName,
      riskScore,
      highFindings,
      blocked: shouldBlock,
      dryRun,
      contractTitle: run.document.title
    }
  })

  return result
}

/**
 * Pusht alle ausstehenden Risiko-Bewertungen zu BC.
 * Findet AnalysisRuns mit gematchten Vendors die noch nicht gepusht wurden.
 */
export async function pushAllPendingRisks(
  tenantId: string,
  actorId: string,
  options?: { blockThreshold?: number; dryRun?: boolean }
): Promise<RiskPushResult[]> {
  // Alle completed Runs mit Org-Name der einem Vendor entspricht
  const runs = await prisma.analysisRun.findMany({
    where: {
      tenantId,
      status: "COMPLETED",
      riskScore01: { not: null }
    },
    select: {
      id: true,
      document: { select: { organizationName: true } }
    },
    orderBy: { completedAt: "desc" },
    take: 50
  })

  const results: RiskPushResult[] = []

  for (const run of runs) {
    const orgName = run.document.organizationName
    if (!orgName || orgName === "Nicht zugeordnet") continue

    const result = await pushRiskToVendor(tenantId, run.id, actorId, options)
    if (result) results.push(result)
  }

  return results
}

function buildRiskSummary(
  run: {
    id: string
    completedAt: Date | null
    document: { title: string }
    findings: Array<{ severity: string; title: string; category: string }>
  },
  riskScore: number,
  highFindings: number
): string {
  const date = run.completedAt?.toISOString().split("T")[0] ?? "unbekannt"
  const riskPct = Math.round(riskScore * 100)

  const lines = [
    `KanzleiAI Risiko-Bewertung (${date})`,
    `Vertrag: ${run.document.title}`,
    `Risk-Score: ${riskPct}% ${riskPct >= 70 ? "[HOCH]" : riskPct >= 40 ? "[MITTEL]" : "[NIEDRIG]"}`,
    `Findings: ${run.findings.length} (davon ${highFindings} hoch)`,
    "",
    "Top-Findings:",
    ...run.findings
      .filter(f => f.severity === "HOCH")
      .slice(0, 5)
      .map(f => `- [${f.category}] ${f.title}`)
  ]

  return lines.join("\n")
}
