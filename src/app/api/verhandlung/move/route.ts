export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const NEGOTIATION_SYSTEM_PROMPT = `Du bist ein KI-gestützter Verhandlungssimulator für juristische Vertragsverhandlungen im DACH-Raum.

Du spielst ZWEI Rollen in einer Antwort:

**ROLLE 1 — GEGENPARTEI:** Du bist der Verhandlungspartner. Du reagierst realistisch, professionell und angemessen hartnäckig auf den Verhandlungszug des Nutzers. Du hast eigene Interessen und gibst nicht sofort nach. Bei starken Argumenten (BGB-Referenzen, Marktdaten, konstruktive Alternativen) zeigst du dich gesprächsbereiter. Bei schwachen Argumenten bleibst du bei deiner Position.

**ROLLE 2 — VERHANDLUNGSCOACH:** Du bewertest den letzten Zug des Nutzers sachlich:
- Score (0-100): Wie wirksam war der Verhandlungszug?
- Feedback: Was war gut? Was fehlt? Konkrete Verbesserungsvorschläge.

**FORMAT — halte dich EXAKT an dieses Format:**

GEGENPARTEI:
[Deine Antwort als Verhandlungspartner, 2-4 Sätze, professioneller Ton]

---COACH---
SCORE: [Zahl 0-100]
FEEDBACK: [2-3 Sätze konkretes Feedback mit Verbesserungsvorschlag]

**REGELN:**
- Deutsch, professionell, realitätsnah
- Verweise auf BGB, HGB, AGB-Recht wo relevant
- Der Trennmarker ---COACH--- muss exakt so erscheinen
- Kein Markdown in der Gegenpartei-Antwort
- Score-Kriterien: Rechtliche Fundierung (30%), Marktkenntnis (25%), Konstruktive Alternativen (25%), Kommunikation (20%)`

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  const body = await request.json()
  const { scenario, history, userMove } = body as {
    scenario: { title: string; counterparty: string; objectives: string[]; contractType: string; difficulty: string }
    history: Array<{ role: string; content: string }>
    userMove: string
  }

  if (!scenario || !userMove?.trim()) {
    return NextResponse.json({ error: "Szenario und Verhandlungszug erforderlich" }, { status: 400 })
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    return NextResponse.json({ error: "KI-Provider nicht konfiguriert" }, { status: 503 })
  }

  const scenarioContext = `SZENARIO: ${scenario.title}
VERTRAGSTYP: ${scenario.contractType}
GEGENPARTEI-PROFIL: ${scenario.counterparty}
SCHWIERIGKEIT: ${scenario.difficulty}
VERHANDLUNGSZIELE DES NUTZERS: ${scenario.objectives.join("; ")}`

  // Build conversation for Anthropic (alternating user/assistant)
  const conversationMessages: Array<{ role: "user" | "assistant"; content: string }> = []

  for (const msg of history) {
    if (msg.role === "user") {
      conversationMessages.push({ role: "user", content: msg.content })
    } else if (msg.role === "opponent") {
      conversationMessages.push({ role: "assistant", content: msg.content })
    }
    // Coach messages werden nicht mitgeschickt — nur für den Nutzer
  }

  // Add the current user move
  conversationMessages.push({ role: "user", content: userMove })

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default
    const client = new Anthropic({ apiKey: anthropicKey })

    const stream = await client.messages.stream({
      model: process.env.ANTHROPIC_CHAT_MODEL?.trim() || "claude-sonnet-4-6",
      max_tokens: 2048,
      temperature: 0.5,
      system: `${NEGOTIATION_SYSTEM_PROMPT}\n\n${scenarioContext}`,
      messages: conversationMessages
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && "delta" in event && "text" in event.delta) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`))
            }
          }
          const finalMessage = await stream.finalMessage()
          const tokens = (finalMessage.usage?.input_tokens ?? 0) + (finalMessage.usage?.output_tokens ?? 0)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, tokens })}\n\n`))
          controller.close()
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err instanceof Error ? err.message : "Stream-Fehler" })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      }
    })
  } catch (e) {
    console.error("[VERHANDLUNG] Fehler:", e)
    return NextResponse.json({ error: "KI-Verhandlung fehlgeschlagen" }, { status: 500 })
  }
}
