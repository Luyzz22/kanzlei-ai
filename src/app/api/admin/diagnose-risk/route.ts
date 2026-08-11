import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { createAnthropicClient, claudeConfigured } from "@/lib/ai/anthropic-client"
import { activeClaudeModelId } from "@/lib/ai/claude-model-config"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { authorizeAiRequest, PolicyViolationError } from "@/lib/compliance/model-gateway"
import { requireNonProductionOrAdmin } from "@/lib/security/admin-route-guard"
import { buildRiskAndGuidancePromptBody } from "@/lib/ai/prompt-registry/contract-defaults"
import { stripCodeFences, parseJsonUnknown, riskAndGuidanceStageSchema } from "@/lib/ai/schemas/contract-analysis"

const TEST_CONTRACT = `GEHEIMHALTUNGSVEREINBARUNG

zwischen TestCorp GmbH ("Offenlegende Partei") und DemoCorp AG ("Empfangende Partei").

§ 1 Gegenstand: Vertrauliche Informationen zum Projekt Alpha.
§ 2 Geheimhaltungspflicht: Der Empfaenger verpflichtet sich, alle Informationen streng vertraulich zu behandeln.
§ 3 Verwendungszweck: Nur fuer den vereinbarten Zweck.
§ 4 Vertragsstrafe: Bei Verstoss zahlt der Empfaenger EUR 100.000 pro Verstoss.
§ 5 Laufzeit: Diese Vereinbarung gilt unbefristet.
§ 6 Gerichtsstand: Berlin. Anwendbares Recht: Deutsches Recht.`

const TEST_EXTRACTION_SUMMARY = JSON.stringify({
  contractType: "Geheimhaltungsvereinbarung (NDA)",
  parties: [
    { name: "TestCorp GmbH", role: "Offenlegende Partei" },
    { name: "DemoCorp AG", role: "Empfangende Partei" }
  ],
  term: { endHint: "unbefristet" }
})

export async function GET() {
  // Production: diagnostic endpoint not available
  const denied = await requireNonProductionOrAdmin()
  if (denied) return denied

  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const model = activeClaudeModelId()

  if (!claudeConfigured()) {
    return NextResponse.json({ error: "Claude-Provider nicht konfiguriert (ANTHROPIC_API_KEY oder AI_BEDROCK_ENABLED)" }, { status: 500 })
  }

  // ── Policy Decision Point ────────────────────────────────────────────────
  // Klasse 0: verarbeitet wird ausschliesslich der oben fest einkompilierte
  // TEST_CONTRACT (fiktive TestCorp/DemoCorp). Es gibt hier keine Eingabe von
  // aussen und damit kein Mandatsgeheimnis. Der Aufruf laeuft trotzdem ueber
  // das Gateway, damit auch Diagnosewege im Audit auftauchen.
  const tenantCtx = await resolveTenantContextForUser(session.user.id)
  const tenantId = tenantCtx.status === "single" ? tenantCtx.tenantId : session.user.id

  try {
    await authorizeAiRequest({
      classification: 0,
      tenantId,
      actorId: session.user.id,
      useCase: "admin-diagnose-risk"
    })
  } catch (err) {
    if (err instanceof PolicyViolationError) {
      return NextResponse.json(
        { error: "Anfrage durch KI-Richtlinie blockiert", reason: err.decision.reason },
        { status: 403 }
      )
    }
    throw err
  }

  const prompt = buildRiskAndGuidancePromptBody(TEST_CONTRACT, TEST_EXTRACTION_SUMMARY)
  const userContent = `${prompt}\n\n${TEST_CONTRACT}\n\nAntworte ausschließlich mit einem gültigen JSON-Objekt ohne Markdown oder Erklärtext.`

  try {
    const client = await createAnthropicClient()

    const startMs = Date.now()
    const response = await client.messages.create({
      model,
      max_tokens: 16384,
      temperature: 0.2,
      messages: [{ role: "user", content: userContent }]
    })
    const durationMs = Date.now() - startMs

    const firstBlock = response.content[0]
    const rawText = ("text" in firstBlock && typeof firstBlock.text === "string") ? firstBlock.text : ""

    // Diagnose-Schritte
    const startsWithBrace = rawText.trim().startsWith("{")
    const containsBackticks = rawText.includes("```")
    const stripped = stripCodeFences(rawText)
    const strippedDiffers = stripped !== rawText.trim()

    let parseOk = false
    let parseError: string | null = null
    let schemaOk = false
    let schemaError: string | null = null

    try {
      const parsed = parseJsonUnknown(rawText)
      parseOk = true
      const validated = riskAndGuidanceStageSchema.safeParse(parsed)
      schemaOk = validated.success
      if (!validated.success) {
        schemaError = JSON.stringify(validated.error.issues.slice(0, 5))
      }
    } catch (e) {
      parseError = e instanceof Error ? e.message : String(e)
    }

    return NextResponse.json({
      model,
      durationMs,
      tokensIn: response.usage?.input_tokens,
      tokensOut: response.usage?.output_tokens,
      diagnosis: {
        rawLength: rawText.length,
        startsWithBrace,
        containsBackticks,
        strippedDiffers,
        parseOk,
        parseError,
        schemaOk,
        schemaError
      },
      // Erste und letzte 300 Zeichen des Raw-Outputs
      rawHead: rawText.slice(0, 300),
      rawTail: rawText.slice(-300)
    })
  } catch (e) {
    return NextResponse.json({
      error: "Anthropic API Fehler",
      message: e instanceof Error ? e.message : String(e)
    }, { status: 500 })
  }
}
