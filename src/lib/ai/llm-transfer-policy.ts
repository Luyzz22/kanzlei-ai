/**
 * LLM Transfer Policy Guard
 *
 * Evaluiert vor jedem LLM-Provider-Aufruf, ob der Transfer zulässig ist.
 * Berücksichtigt: Datensensitivität, Provider-Region, Mandatsgeheimnis,
 * Pseudonymisierung, Tenant-Governance.
 *
 * DSGVO Art. 5 Abs. 1 lit. c, f / Art. 25 / Art. 32 / Art. 44 ff.
 * § 203 StGB / BRAO § 43e
 * EU AI Act Art. 12, 14, 15
 *
 * Zwei Modi:
 * - log_only: warnt structured, blockiert nicht
 * - block: wirft Error (kein PII in Error-Message)
 */

export type DataSensitivity =
  | "public"
  | "internal"
  | "confidential"
  | "mandate_secret"

export type LlmProviderName =
  | "openai"
  | "anthropic"
  | "gemini"
  | "llama"
  | "local"

export type LlmTransferPolicyInput = {
  tenantId?: string
  userId?: string
  provider: LlmProviderName
  sensitivity: DataSensitivity
  containsPersonalData: boolean
  containsMandateSecret: boolean
  allowThirdCountryLlmTransfer: boolean
  pseudonymized: boolean
  enforcementMode: "log_only" | "block"
  purpose:
    | "contract_analysis"
    | "contract_copilot"
    | "risk_guidance"
    | "classification"
    | "extraction"
    | "other"
}

export type LlmTransferDecision = {
  allowed: boolean
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  reasons: string[]
  requiredActions: string[]
}

/**
 * Provider-Standortklassifikation.
 * OpenAI, Anthropic, Gemini = US-basiert = Drittland i.S.d. DSGVO Art. 44.
 * Llama/local = on-premise oder EU-gehostet.
 */
const THIRD_COUNTRY_LLM_PROVIDERS: LlmProviderName[] = [
  "openai",
  "anthropic",
  "gemini",
]

function isThirdCountryProvider(provider: LlmProviderName): boolean {
  return THIRD_COUNTRY_LLM_PROVIDERS.includes(provider)
}

/**
 * Evaluiert die LLM Transfer Policy ohne Seiteneffekte.
 * Gibt immer eine Entscheidung zurück (auch bei allowed=false).
 */
export function evaluateLlmTransferPolicy(
  input: LlmTransferPolicyInput
): LlmTransferDecision {
  const reasons: string[] = []
  const requiredActions: string[] = []
  let severity: LlmTransferDecision["severity"] = "LOW"
  let allowed = true

  const thirdCountry = isThirdCountryProvider(input.provider)

  // ── Regel 1: Mandatsgeheimnis + Drittland ────────────────────────────
  if (
    input.containsMandateSecret &&
    thirdCountry &&
    !input.allowThirdCountryLlmTransfer
  ) {
    severity = "CRITICAL"
    allowed = false
    reasons.push(
      `Mandatsgeheimnisgeschützte Daten (§ 203 StGB) dürfen nicht an Drittland-Provider (${input.provider}) übermittelt werden.`
    )
    requiredActions.push(
      "Pseudonymisierung aktivieren oder EU-/lokalen Provider verwenden.",
      "Tenant-Governance: allowThirdCountryLlmTransfer explizit freigeben falls gewünscht."
    )
  }

  // ── Regel 2: Vertraulich/Mandatsgeheimnis + nicht pseudonymisiert ────
  if (
    (input.sensitivity === "confidential" ||
      input.sensitivity === "mandate_secret") &&
    !input.pseudonymized &&
    thirdCountry
  ) {
    if (severity !== "CRITICAL") severity = "HIGH"
    if (input.sensitivity === "mandate_secret") {
      allowed = false
    }
    reasons.push(
      `Vertrauliche Daten (${input.sensitivity}) ohne Pseudonymisierung an ${input.provider} — DSGVO Art. 25/32.`
    )
    requiredActions.push(
      "Pseudonymisierung vor LLM-Transfer aktivieren.",
      "Datenminimierung prüfen (DSGVO Art. 5 Abs. 1 lit. c)."
    )
  }

  // ── Regel 3: Personenbezogene Daten + Drittland ──────────────────────
  if (input.containsPersonalData && thirdCountry && !input.pseudonymized) {
    if (severity === "LOW") severity = "MEDIUM"
    reasons.push(
      `Personenbezogene Daten ohne Pseudonymisierung an Drittland-Provider (${input.provider}) — DSGVO Art. 44 ff.`
    )
    requiredActions.push(
      "TIA/SCC-Nachweis für Provider sicherstellen.",
      "Pseudonymisierung erwägen."
    )
  }

  // ── Regel 4: Public/Internal = grundsätzlich erlaubt ─────────────────
  // (keine zusätzlichen Einschränkungen)

  // ── Enforcement ──────────────────────────────────────────────────────
  // Im log_only-Modus darf auch bei allowed=false fortgefahren werden,
  // aber Decision und Reasons bleiben für Audit erhalten.
  if (input.enforcementMode === "log_only" && !allowed) {
    // Erlaube weiter, aber mit Documentation
    allowed = true
    requiredActions.push(
      "ACHTUNG: Transfer nur wegen enforcementMode=log_only erlaubt. block-Modus sollte aktiviert werden."
    )
  }

  return { allowed, severity, reasons, requiredActions }
}

/**
 * Evaluiert Policy und wirft Error wenn blockiert.
 * Error-Messages enthalten KEINE PII, Vertragstext oder Tenant-Details.
 */
export function assertLlmTransferAllowed(
  input: LlmTransferPolicyInput
): LlmTransferDecision {
  const decision = evaluateLlmTransferPolicy(input)

  if (!decision.allowed && input.enforcementMode === "block") {
    throw new LlmTransferBlockedError(
      decision.severity,
      decision.reasons.length,
      input.provider,
      input.purpose
    )
  }

  return decision
}

/**
 * Structured Error — enthält KEINE PII.
 */
export class LlmTransferBlockedError extends Error {
  readonly code = "LLM_TRANSFER_BLOCKED"

  constructor(
    readonly severity: LlmTransferDecision["severity"],
    readonly reasonCount: number,
    readonly provider: LlmProviderName,
    readonly purpose: string
  ) {
    super(
      `LLM-Transfer blockiert: Provider=${provider}, Severity=${severity}, ` +
        `Gründe=${reasonCount}. Tenant-Governance oder Pseudonymisierung prüfen.`
    )
    this.name = "LlmTransferBlockedError"
  }
}
