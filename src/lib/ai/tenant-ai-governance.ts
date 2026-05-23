import "server-only"

import { prisma } from "@/lib/prisma"

/**
 * Tenant AI Governance — Tenant-spezifische KI-Steuerung
 *
 * Lädt Governance-Settings defensiv aus der DB (TenantGovernanceSettings).
 * Falls Felder fehlen (weil Migration noch nicht gelaufen): ENV-Fallbacks.
 *
 * Konservative Defaults:
 * - allowThirdCountryLlmTransfer = false (kein Drittlandtransfer ohne explizite Freigabe)
 * - aiPolicyEnforcement = log_only (risikoarmer Start, aber block aktivierbar)
 * - requirePseudonymization = false (aktivierbar, aber nicht default)
 *
 * Ref: DSGVO Art. 5/25/32/44 ff., § 203 StGB, EU AI Act Art. 12/14
 */

export type TenantAiGovernance = {
  allowedProviders: string[]
  preferEuModels: boolean
  requirePseudonymization: boolean
  allowThirdCountryLlmTransfer: boolean
  aiPolicyEnforcement: "log_only" | "block"
}

/**
 * Lädt Tenant-spezifische AI-Governance-Settings.
 * Defensiv: fängt DB-Fehler ab und gibt konservative Defaults zurück.
 */
export async function getTenantAiGovernance(
  tenantId: string
): Promise<TenantAiGovernance> {
  try {
    const settings = await prisma.tenantGovernanceSettings.findUnique({
      where: { tenantId },
      select: {
        allowedProviders: true,
        preferEuModels: true,
      },
    })

    if (!settings) {
      return getEnvFallbackGovernance()
    }

    return {
      allowedProviders: settings.allowedProviders ?? [],
      preferEuModels: settings.preferEuModels ?? false,
      // Felder die noch nicht im Prisma-Schema sind → ENV-Fallback
      requirePseudonymization: envBool("AI_REQUIRE_PSEUDONYMIZATION", false),
      allowThirdCountryLlmTransfer: envBool(
        "AI_ALLOW_THIRD_COUNTRY_LLM_TRANSFER",
        false
      ),
      aiPolicyEnforcement: envPolicyMode(
        "AI_POLICY_ENFORCEMENT",
        "log_only"
      ),
    }
  } catch {
    // DB-Fehler: konservative Defaults, kein Crash
    return getEnvFallbackGovernance()
  }
}

/**
 * ENV-basierte Fallback-Governance wenn DB nicht erreichbar oder Tenant nicht existiert.
 */
function getEnvFallbackGovernance(): TenantAiGovernance {
  const allowedProvidersRaw = process.env.AI_ALLOWED_PROVIDERS?.trim()
  const allowedProviders = allowedProvidersRaw
    ? allowedProvidersRaw.split(",").map((p) => p.trim())
    : []

  return {
    allowedProviders,
    preferEuModels: envBool("AI_PREFER_EU_MODELS", false),
    requirePseudonymization: envBool("AI_REQUIRE_PSEUDONYMIZATION", false),
    allowThirdCountryLlmTransfer: envBool(
      "AI_ALLOW_THIRD_COUNTRY_LLM_TRANSFER",
      false
    ),
    aiPolicyEnforcement: envPolicyMode("AI_POLICY_ENFORCEMENT", "log_only"),
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

function envBool(key: string, fallback: boolean): boolean {
  const val = process.env[key]?.trim().toLowerCase()
  if (val === "true" || val === "1") return true
  if (val === "false" || val === "0") return false
  return fallback
}

function envPolicyMode(
  key: string,
  fallback: "log_only" | "block"
): "log_only" | "block" {
  const val = process.env[key]?.trim().toLowerCase()
  if (val === "block") return "block"
  if (val === "log_only") return "log_only"
  return fallback
}
