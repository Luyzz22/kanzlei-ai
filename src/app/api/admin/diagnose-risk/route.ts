import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
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
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const model = process.env.ANTHROPIC_CHAT_MODEL?.trim() || "claude-sonnet-4-6"
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY nicht gesetzt" }, { status: 500 })
  }

  const prompt = buildRiskAndGuidancePromptBody(TEST_CONTRACT, TEST_EXTRACTION_SUMMARY)
  const userContent = `${prompt}\n\n${TEST_CONTRACT}\n\nAntworte ausschließlich mit einem gültigen JSON-Objekt ohne Markdown oder Erklärtext.`

  try {
    const anthropicModule = await import("@anthropic-ai/sdk")
    const Anthropic = anthropicModule.default
    const client = new Anthropic({ apiKey })

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
