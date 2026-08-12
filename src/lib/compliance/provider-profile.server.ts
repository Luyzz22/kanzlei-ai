import "server-only"

import { anthropicBackend } from "@/lib/ai/anthropic-client"
import { prisma } from "@/lib/prisma"
import { log } from "@/lib/security/secure-logging"

import type { ProviderProfileSnapshot } from "./provider-profile"

/**
 * Laden der Anbieterfreigaben. Die Bewertung selbst liegt in
 * `provider-profile.ts` und bleibt dadurch pur und testbar.
 */

/**
 * Schlüssel des aktuell aktiven externen Anbieters.
 *
 * Direkte Anthropic-API und Claude über Bedrock EU sind **rechtlich
 * verschiedene Anbieter**: andere Vertragspartner, andere Datenresidenz,
 * andere Unterauftragsverarbeiter. Sie teilen sich deshalb bewusst kein
 * Profil — eine Freigabe für Bedrock EU sagt nichts über die direkte API aus.
 */
export function activeExternalProviderKey(): string {
  return `anthropic:${anthropicBackend()}`
}

/**
 * Lädt das Profil des aktiven externen Anbieters.
 *
 * Fail closed: Ist die Tabelle nicht erreichbar, wird `null` geliefert — das
 * führt in `decideRouting` zu `PROVIDER_PROFILE_MISSING` und damit zum lokalen
 * Weg. Ein DB-Ausfall darf keine Freigabe erzeugen.
 */
export async function loadActiveProviderProfile(): Promise<ProviderProfileSnapshot | null> {
  const provider = activeExternalProviderKey()
  try {
    const row = await prisma.providerProfile.findUnique({ where: { provider } })
    if (!row) return null

    return {
      provider: row.provider,
      trustTier: row.trustTier,
      verificationStatus: row.verificationStatus,
      allowedDataClasses: row.allowedDataClasses,
      euDataBoundaryVerified: row.euDataBoundaryVerified,
      noTrainingVerified: row.noTrainingVerified,
      zeroRetentionVerified: row.zeroRetentionVerified,
      noHumanAccessVerified: row.noHumanAccessVerified,
      abuseMonitoringDisabled: row.abuseMonitoringDisabled,
      supportEuOnlyVerified: row.supportEuOnlyVerified,
      section43eAgreementSignedAt: row.section43eAgreementSignedAt,
      dpaSignedAt: row.dpaSignedAt,
      tiaApprovedAt: row.tiaApprovedAt,
      expiresAt: row.expiresAt
    }
  } catch (error) {
    log.warn("gateway.provider_profile_unavailable", {
      provider,
      code: error instanceof Error ? error.name : "UNKNOWN"
    })
    return null
  }
}
