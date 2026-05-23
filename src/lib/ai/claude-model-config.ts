/**
 * Zentrale Anthropic-Modell-Konfiguration (Hotfix 9).
 *
 * ## Warum Alias vs. datiertes Modell wichtig ist
 *
 * Anthropic unterscheidet zwei Arten von Modell-IDs:
 *
 * 1. **Alias ohne Datum** — z.B. `claude-sonnet-4-5`, `claude-sonnet-4-6`
 *    Zeigt immer auf die *aktuelle* Snapshot-Version. Anthropic kann den
 *    Snapshot still wechseln → Output-Limits und Verhalten können sich ändern.
 *
 * 2. **Datierte Snapshot-ID** — z.B. `claude-sonnet-4-6-20260217`,
 *    `claude-sonnet-4-5-20250929`
 *    Pinnt reproduzierbare Limits und Verhalten für Compliance/Audit.
 *
 * ### Output-Token-Limits (Stand 2026)
 *
 * | Modell-ID                         | Standard-Tier max_tokens | Mit Beta-Header |
 * |-----------------------------------|--------------------------|-----------------|
 * | claude-sonnet-4-5-20250929        | 64.000                   | 64.000+         |
 * | claude-sonnet-4-5 (Alias)         | oft 32.768 ohne Beta     | variiert        |
 * | claude-sonnet-4-6-20260217        | 64.000                   | 128.000         |
 * | claude-sonnet-4-6 (Alias)         | 64.000                   | 128.000         |
 *
 * **Dein Production-Problem:** `ANTHROPIC_CHAT_MODEL=claude-sonnet-4-5` (Alias)
 * + `max_tokens=64000` → manchmal sofortiger 400 Bad Request (913 ms, 0 Tokens),
 * weil der Alias auf einen Snapshot zeigt, der ohne Beta-Header nur 32.768 erlaubt.
 *
 * ### Fix in Vercel
 *
 * ```bash
 * # Option A (empfohlen): Datiertes Modell pinnen
 * ANTHROPIC_CHAT_MODEL=claude-sonnet-4-6-20260217
 *
 * # Option B: Alias behalten, Code capped auf 32768 (Hotfix 8)
 *
 * # Option C: Höheres Limit mit Beta-Header (automatisch ab max_tokens > 32768)
 * # Kein extra ENV nötig — claude-provider setzt Header wenn nötig.
 * ```
 */

/** Reproduzierbarer Default — datiertes Sonnet 4.6 Snapshot. */
export const DEFAULT_ANTHROPIC_CHAT_MODEL = "claude-sonnet-4-6-20260217"

/** Standard-Tier ohne Beta-Header — sicher bei allen aktuellen Sonnet-4.x Snapshots. */
export const ANTHROPIC_SAFE_MAX_OUTPUT_TOKENS = 32_768

/** Beta-Header für erweiterte Output-Limits (>32k). */
export const ANTHROPIC_EXTENDED_OUTPUT_BETA = "output-128k-2025-02-19"

const ALIAS_TO_PINNED: Record<string, string> = {
  "claude-sonnet-4-5": "claude-sonnet-4-5-20250929",
  "claude-sonnet-4-6": "claude-sonnet-4-6-20260217",
  "claude-sonnet-4": "claude-sonnet-4-6-20260217"
}

export type AnthropicModelProfile = {
  /** Effektive API-Modell-ID (nach Alias-Auflösung). */
  modelId: string
  /** Roher ENV-/Override-Wert (für Logging). */
  configuredId: string
  /** Ob ein Alias auf einen Snapshot gemappt wurde. */
  wasAliasResolved: boolean
  /** Max Output-Tokens ohne Beta-Header. */
  standardMaxOutputTokens: number
  /** Absolutes Maximum mit Beta-Header (falls unterstützt). */
  extendedMaxOutputTokens: number
}

function isDatedSnapshot(modelId: string): boolean {
  return /\d{8}$/.test(modelId) || /-\d{4}-\d{2}-\d{2}$/.test(modelId)
}

/**
 * Löst ANTHROPIC_CHAT_MODEL auf und liefert Token-Limits.
 *
 * `AI_ANTHROPIC_PIN_ALIASES=false` deaktiviert Alias→Snapshot-Mapping
 * (nur für Debugging).
 */
export function resolveAnthropicModelProfile(): AnthropicModelProfile {
  const configured = process.env.ANTHROPIC_CHAT_MODEL?.trim() || DEFAULT_ANTHROPIC_CHAT_MODEL
  const pinAliases = process.env.AI_ANTHROPIC_PIN_ALIASES !== "false"

  let modelId = configured
  let wasAliasResolved = false

  if (pinAliases && !isDatedSnapshot(configured) && ALIAS_TO_PINNED[configured]) {
    modelId = ALIAS_TO_PINNED[configured]!
    wasAliasResolved = true
  }

  const isSonnet46 = modelId.includes("4-6") || modelId.includes("20260217")
  const isSonnet45 = modelId.includes("4-5") || modelId.includes("20250929")

  let standardMax = ANTHROPIC_SAFE_MAX_OUTPUT_TOKENS
  let extendedMax = ANTHROPIC_SAFE_MAX_OUTPUT_TOKENS

  if (isSonnet46) {
    standardMax = 64_000
    extendedMax = 128_000
  } else if (isSonnet45) {
    standardMax = 64_000
    extendedMax = 64_000
  }

  return {
    modelId,
    configuredId: configured,
    wasAliasResolved,
    standardMaxOutputTokens: standardMax,
    extendedMaxOutputTokens: extendedMax
  }
}

/** Effektive Modell-ID für API-Calls. */
export function anthropicChatModelId(): string {
  return resolveAnthropicModelProfile().modelId
}

/**
 * Cap für Pipeline-Stage-Default auf Provider-Maximum.
 * Nutzt extendedMax nur wenn Beta-Header gesetzt werden kann.
 */
export function anthropicEffectiveMaxOutputTokens(requested: number, useExtendedBeta: boolean): number {
  const profile = resolveAnthropicModelProfile()
  const cap = useExtendedBeta ? profile.extendedMaxOutputTokens : profile.standardMaxOutputTokens
  return Math.min(requested, cap)
}

/** Beta-Header nur für Sonnet 4.6 (>32k Output). 4.5 unterstützt 64k ohne 128k-Beta — falsches Beta → sofort 400. */
export function anthropicBetaHeaders(requestedMaxTokens: number): Record<string, string> | undefined {
  const profile = resolveAnthropicModelProfile()
  if (requestedMaxTokens <= ANTHROPIC_SAFE_MAX_OUTPUT_TOKENS) return undefined

  const isSonnet46 =
    profile.modelId.includes("4-6") || profile.modelId.includes("20260217")
  if (!isSonnet46) return undefined

  if (profile.extendedMaxOutputTokens <= ANTHROPIC_SAFE_MAX_OUTPUT_TOKENS) return undefined
  return { "anthropic-beta": ANTHROPIC_EXTENDED_OUTPUT_BETA }
}

/** Vertragsanalyse: nur Claude Sonnet, kein stilles Fallback auf US-Alternativen (Compliance). */
export function contractAnalysisClaudeOnly(): boolean {
  return process.env.AI_CONTRACT_ANALYSIS_CLAUDE_ONLY !== "false"
}
