#!/usr/bin/env node
/**
 * LLM Egress Guard — Phase A1 "Stop the Bleeding".
 *
 * Zielzustand (Compliance-Handoff A1): Kein Code ausserhalb eines zentralen
 * ModelGateway darf Provider-SDKs importieren oder Modell-Hosts direkt
 * ansprechen. Dieser Guard erzwingt den Zielzustand noch nicht — er friert
 * den heutigen Stand ein: bestehende Egress-Punkte sind als technische
 * Schuld dokumentiert, NEUE fallen sofort in der CI durch.
 *
 * Zwei Richtungen, beide blockierend:
 *
 *   1. Egress ausserhalb der Allowlist  → neuer Umgehungspfad, Build rot.
 *   2. Allowlist-Eintrag ohne Egress    → Schuld getilgt, Eintrag entfernen.
 *
 * Regel 2 sorgt dafür, dass die Liste beim Umbau auf den ModelGateway
 * mechanisch schrumpft und nie unbemerkt veraltet.
 */
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const failures = []

/**
 * Provider-SDKs, deren Import einen externen Modellaufruf ermöglicht.
 * Bewusst als Import-Muster formuliert (nicht als blosser Worttreffer),
 * damit Provider-*Namen* in Policy-/Routing-Tabellen nicht anschlagen —
 * z. B. `provider: "openai"` in llm-transfer-policy.ts ist kein Egress.
 */
const EGRESS_MODULES = [
  "openai",
  "@anthropic-ai/sdk",
  "@anthropic-ai/bedrock-sdk",
  "@google/generative-ai",
  "@google/genai",
  "@aws-sdk/client-bedrock-runtime"
]

/** Modell-Hosts, die per fetch()/HTTP direkt angesprochen werden können. */
const EGRESS_URL_FRAGMENTS = [
  "api.openai.com",
  "api.anthropic.com",
  "generativelanguage.googleapis.com",
  ".openai.azure.com",
  "bedrock-runtime."
]

/**
 * Dokumentierte Alt-Egress-Punkte (Stand: Freeze).
 *
 * Jeder Eintrag ist technische Schuld und wird in der Gateway-Phase
 * (Handoff Schritt 2–3) auf `executeAiRequest()` migriert und hier entfernt.
 * Neue Einträge gehören in einen Review durch die CODEOWNERS des
 * Hybrid-Keystones — nicht in einen beiläufigen Feature-PR.
 */
const ALLOWLIST = new Map([
  [
    "src/lib/ai/anthropic-client.ts",
    "Anthropic/Bedrock-Client-Factory — künftiger Transport des ModelGateway"
  ],
  [
    "src/app/api/health/route.ts",
    "HEAD-Healthcheck gegen api.anthropic.com — kein Payload-Egress"
  ],
  [
    "src/app/api/admin/test-anthropic/route.ts",
    "Admin-Konnektivitätstest — kein Mandatsinhalt"
  ]
])

/**
 * Wer einen Transport konstruiert, muss vorher das Gateway fragen.
 *
 * Diese Regel existiert, weil genau das schiefging: `src/lib/ai/analyzer.ts`
 * rief `createProvider()` direkt auf und bediente damit drei API-Routen an
 * jedem Policy Decision Point vorbei. Der Egress-Guard hat das nicht gesehen,
 * weil analyzer.ts kein Provider-SDK importiert — nur die Fabrik.
 */
const TRANSPORT_FACTORIES = ["createProvider", "createAnthropicClient"]

/** Der Gateway-Aufruf, der einen Transport-Nutzer legitimiert. */
const GATEWAY_CALL = "authorizeAiRequest"

/**
 * Dateien, die den Transport selbst bereitstellen oder verdrahten. Sie treffen
 * keine Policy-Entscheidung und dürfen die Fabriken deshalb ohne Gateway-Aufruf
 * nennen.
 */
const TRANSPORT_INFRASTRUCTURE = new Set([
  "src/lib/ai/providers/registry.ts",
  "src/lib/ai/providers/index.ts",
  "src/lib/ai/anthropic-client.ts",
  "src/lib/ai/providers/claude-provider.ts",
  "src/lib/ai/provider-availability.ts"
])

function buildImportPatterns(moduleName) {
  const quoted = moduleName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return [
    new RegExp(`from\\s+["']${quoted}["']`),
    new RegExp(`import\\s*\\(\\s*["']${quoted}["']\\s*\\)`),
    new RegExp(`require\\s*\\(\\s*["']${quoted}["']\\s*\\)`)
  ]
}

const IMPORT_PATTERNS = EGRESS_MODULES.flatMap((moduleName) =>
  buildImportPatterns(moduleName).map((pattern) => ({ moduleName, pattern }))
)

async function collectFiles(relativeDir) {
  const entries = await readdir(path.join(root, relativeDir), { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry.name)
    if (entry.isDirectory()) files.push(...(await collectFiles(relativePath)))
    else if (isScannableFile(relativePath)) files.push(relativePath)
  }
  return files
}

/**
 * `.d.ts` deklariert Modultypen (`declare module "@anthropic-ai/sdk"`) und
 * erzeugt keinen Aufruf. Tests versenden nichts und dürfen Hosts als
 * Prüfstrings führen — beides ist kein Egress-Pfad.
 */
function isScannableFile(file) {
  if (!file.endsWith(".ts") && !file.endsWith(".tsx")) return false
  if (file.endsWith(".d.ts")) return false
  if (file.includes("__tests__") || file.includes(".test.")) return false
  return true
}

function fail(message) {
  failures.push(message)
  console.error(`not ok - ${message}`)
}

function pass(message) {
  console.log(`ok - ${message}`)
}

function findEgress(source) {
  const reasons = []
  for (const { moduleName, pattern } of IMPORT_PATTERNS) {
    if (pattern.test(source)) {
      reasons.push(`Import von "${moduleName}"`)
      break
    }
  }
  for (const fragment of EGRESS_URL_FRAGMENTS) {
    if (source.includes(fragment)) reasons.push(`Modell-Host "${fragment}"`)
  }
  return reasons
}

async function main() {
  const files = await collectFiles("src")
  const withEgress = new Map()

  for (const file of files) {
    const source = await readFile(path.join(root, file), "utf8")
    const reasons = findEgress(source)
    if (reasons.length > 0) withEgress.set(file.split(path.sep).join("/"), reasons)
  }

  // 1. Egress ausserhalb der Allowlist → neuer Umgehungspfad.
  for (const [file, reasons] of withEgress) {
    if (ALLOWLIST.has(file)) continue
    fail(
      `${file}: direkter Provider-Egress (${reasons.join(", ")}). ` +
        `Externe Modellaufrufe gehören hinter das zentrale Gateway. ` +
        `Ist das bewusst und berufsrechtlich geprüft, ergänze ALLOWLIST in scripts/check-llm-egress.mjs mit Begründung.`
    )
  }

  // 2. Allowlist-Eintrag ohne Egress → Schuld getilgt, Liste bereinigen.
  for (const [file, reason] of ALLOWLIST) {
    if (withEgress.has(file)) continue
    fail(
      `${file}: steht auf der Egress-Allowlist ("${reason}"), ruft aber keinen Provider mehr direkt auf. ` +
        `Eintrag aus scripts/check-llm-egress.mjs entfernen.`
    )
  }

  // 3. Transport-Nutzer ohne Gateway-Aufruf → Policy Decision Point umgangen.
  let gatewayChecked = 0
  for (const file of files) {
    const normalized = file.split(path.sep).join("/")
    if (TRANSPORT_INFRASTRUCTURE.has(normalized)) continue

    const source = await readFile(path.join(root, file), "utf8")
    const usedFactory = TRANSPORT_FACTORIES.find((fn) => source.includes(`${fn}(`))
    if (!usedFactory) continue

    gatewayChecked += 1
    if (!source.includes(GATEWAY_CALL)) {
      fail(
        `${normalized}: ruft ${usedFactory}() auf, aber nirgends ${GATEWAY_CALL}(). ` +
          `Jeder Modellaufruf braucht vorher eine PolicyDecision. ` +
          `Ist die Datei reine Transport-Infrastruktur, ergänze TRANSPORT_INFRASTRUCTURE in scripts/check-llm-egress.mjs.`
      )
    }
  }

  if (failures.length === 0) {
    pass(
      `Kein Provider-Egress ausserhalb der Allowlist (${files.length} Dateien geprüft, ` +
        `${ALLOWLIST.size} dokumentierte Alt-Pfade)`
    )
    pass(`Alle ${gatewayChecked} Transport-Nutzer rufen ${GATEWAY_CALL}() auf`)
  }
}

await main()

if (failures.length > 0) {
  console.error(`\n${failures.length} Egress-Verstoss/-Verstösse — siehe oben.`)
  process.exit(1)
}

console.log("\nLLM-Egress-Guard grün.")
