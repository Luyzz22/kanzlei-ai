/**
 * LLM Transfer Policy Guard (Audit R-01 / R-02)
 *
 * Erzwingt Datenschutz-Policies vor jedem LLM-Request:
 * - Mandatsdaten dürfen NUR an EU/lokale Provider gehen
 * - Personenbezogene Daten erfordern DPA/SCC + Tenant-Opt-In
 * - Provider-Allowlist pro Tenant wird geprüft
 *
 * DSGVO Art. 5(1b/c), 6, 44–46; BRAO §203; EU AI Act Art. 12–15
 */

import { prisma } from "@/lib/prisma"

export type LlmProvider = "openai" | "anthropic" | "gemini" | "llama" | "local"

export type DataSensitivity = "public" | "internal" | "confidential" | "mandate_secret"

export interface LlmTransferContext {
  tenantId: string
  userId: string
  provider: LlmProvider
  sensitivity: DataSensitivity
  containsPersonalData: boolean
  purpose: "classification" | "extraction" | "risk" | "comparison" | "copilot"
  documentId?: string
}

export type PolicyViolation = {
  code: "MANDATE_DATA_US_PROVIDER" | "PERSONAL_DATA_NO_DPA" | "PROVIDER_NOT_ALLOWED" | "EU_ONLY_VIOLATION"
  message: string
  regulation: string
}

const US_PROVIDERS: LlmProvider[] = ["openai", "anthropic", "gemini"]

/**
 * Prüft ob ein LLM-Request erlaubt ist.
 * Wirft NICHT — gibt stattdessen eine Liste von Violations zurück.
 * Leere Liste = Transfer erlaubt.
 */
export function checkLlmTransferPolicy(ctx: LlmTransferContext): PolicyViolation[] {
  const violations: PolicyViolation[] = []

  // R-01: Mandatsdaten (mandate_secret) NUR an EU/lokale Provider
  if (ctx.sensitivity === "mandate_secret" && US_PROVIDERS.includes(ctx.provider)) {
    violations.push({
      code: "MANDATE_DATA_US_PROVIDER",
      message: `Mandatsdaten dürfen nicht an ${ctx.provider} (US) übertragen werden. Nur EU/lokale Provider erlaubt.`,
      regulation: "DSGVO Art. 44-46, BRAO §203"
    })
  }

  // R-01: Personenbezogene Daten an US-Provider erfordern Opt-In
  if (ctx.containsPersonalData && US_PROVIDERS.includes(ctx.provider)) {
    violations.push({
      code: "PERSONAL_DATA_NO_DPA",
      message: `Personenbezogene Daten an ${ctx.provider} erfordern DPA/SCC und explizites Tenant-Opt-In.`,
      regulation: "DSGVO Art. 28, 44 ff."
    })
  }

  return violations
}

/**
 * Prüft die Tenant-spezifische Provider-Allowlist.
 * Wenn der Tenant preferEuModels hat, werden US-Provider blockiert.
 * Wenn allowedProviders gesetzt ist, werden nur diese erlaubt.
 */
export async function checkTenantProviderPolicy(
  tenantId: string,
  provider: LlmProvider
): Promise<PolicyViolation[]> {
  const violations: PolicyViolation[] = []

  const settings = await prisma.tenantGovernanceSettings.findUnique({
    where: { tenantId },
    select: { allowedProviders: true, preferEuModels: true }
  }).catch(() => null)

  if (!settings) return violations // Keine Settings = keine Einschränkung

  // R-02: EU-Only Modus
  if (settings.preferEuModels && US_PROVIDERS.includes(provider)) {
    violations.push({
      code: "EU_ONLY_VIOLATION",
      message: `Tenant hat EU-Only-Modus aktiviert. ${provider} ist ein US-Provider und blockiert.`,
      regulation: "DSGVO Art. 44-46, Tenant-Governance"
    })
  }

  // Provider-Allowlist
  if (settings.allowedProviders && (settings.allowedProviders as string[]).length > 0) {
    const allowed = settings.allowedProviders as string[]
    if (!allowed.includes(provider)) {
      violations.push({
        code: "PROVIDER_NOT_ALLOWED",
        message: `Provider ${provider} ist nicht in der Tenant-Allowlist [${allowed.join(", ")}].`,
        regulation: "Tenant-Governance, ISO 27001 A.15"
      })
    }
  }

  return violations
}

/**
 * Vollständige Policy-Prüfung: Transfer + Tenant-Allowlist.
 * Gibt violations zurück. Leere Liste = erlaubt.
 */
export async function assertLlmTransferAllowed(ctx: LlmTransferContext): Promise<PolicyViolation[]> {
  const transferViolations = checkLlmTransferPolicy(ctx)
  const tenantViolations = await checkTenantProviderPolicy(ctx.tenantId, ctx.provider)
  return [...transferViolations, ...tenantViolations]
}

/**
 * Bestimmt die Datensensitivität basierend auf dem Inhalt.
 * Heuristik: Enthält der Text typische PII-Marker?
 */
export function inferSensitivity(text: string): { sensitivity: DataSensitivity; containsPersonalData: boolean } {
  const lower = text.toLowerCase()
  const piiPatterns = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/i, // Email
    /\b\d{2}[.\-/]\d{2}[.\-/]\d{4}\b/,                   // Geburtsdatum
    /\bIBAN\b/i, /\bDE\d{20}\b/,                          // IBAN
    /\bSteuer[-\s]?[Nn]ummer\b/,                           // Steuernummer
    /\bSozialversicherung/i,                                // SVN
    /\bPersonal[-\s]?[Nn]ummer\b/i,                        // Personalnummer
  ]

  const containsPersonalData = piiPatterns.some(p => p.test(text))
  const isMandateRelated = lower.includes("mandant") || lower.includes("§") || lower.includes("vertrag")

  let sensitivity: DataSensitivity = "internal"
  if (containsPersonalData && isMandateRelated) sensitivity = "mandate_secret"
  else if (containsPersonalData) sensitivity = "confidential"
  else if (isMandateRelated) sensitivity = "confidential"

  return { sensitivity, containsPersonalData }
}
