import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

/**
 * GET /api/admin/test-anthropic
 *
 * Direkter Anthropic-API-Test zur Diagnose von Modell-Verfügbarkeit.
 * Probiert nacheinander:
 *   1. claude-sonnet-4-6 (das aktuelle Sonnet)
 *   2. claude-sonnet-4-5 (Vorgänger als Fallback)
 *   3. claude-3-5-sonnet-latest (alt aber stabil)
 *
 * Liefert pro Modell den exakten HTTP-Status und Fehler-Body, falls
 * der Call scheitert. Damit sehen wir das Root-Cause-Problem live.
 *
 * ADMIN-only.
 */
export const dynamic = "force-dynamic"

const MODELS_TO_TEST = [
  "claude-sonnet-4-6",
  "claude-sonnet-4-5",
  "claude-3-5-sonnet-latest"
]

type ModelTestResult = {
  model: string
  ok: boolean
  status?: number
  responseSnippet?: string
  errorMessage?: string
  durationMs: number
}

async function testModel(model: string, apiKey: string): Promise<ModelTestResult> {
  const start = Date.now()
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model,
        max_tokens: 50,
        messages: [{ role: "user", content: "Antworte nur mit OK." }]
      })
    })

    const duration = Date.now() - start
    const bodyText = await res.text()

    if (!res.ok) {
      return {
        model,
        ok: false,
        status: res.status,
        errorMessage: bodyText.slice(0, 500),
        durationMs: duration
      }
    }

    return {
      model,
      ok: true,
      status: res.status,
      responseSnippet: bodyText.slice(0, 200),
      durationMs: duration
    }
  } catch (e) {
    return {
      model,
      ok: false,
      errorMessage: e instanceof Error ? e.message : String(e),
      durationMs: Date.now() - start
    }
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY ist nicht in Vercel Env gesetzt" },
      { status: 500 }
    )
  }

  const results: ModelTestResult[] = []
  for (const model of MODELS_TO_TEST) {
    results.push(await testModel(model, apiKey))
  }

  const recommendation = (() => {
    const firstWorking = results.find((r) => r.ok)
    if (!firstWorking) return "Kein Anthropic-Modell verfügbar — API-Key oder Account-Status prüfen"
    if (firstWorking.model === "claude-sonnet-4-6") return "OK — claude-sonnet-4-6 ist verfügbar und sollte als Default funktionieren"
    return `Sonnet 4.6 nicht verfügbar — Fallback auf ${firstWorking.model} empfohlen (ANTHROPIC_CHAT_MODEL setzen)`
  })()

  return NextResponse.json({
    apiKeyFingerprint: apiKey.slice(0, 7) + "..." + apiKey.slice(-4),
    results,
    recommendation,
    timestamp: new Date().toISOString()
  })
}
