export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const SYSTEM_PROMPT = `Du bist der KanzleiAI Contract Copilot — ein Enterprise-KI-Assistent für juristische Vertragsanalyse, spezialisiert auf deutsches Recht und den DACH-Raum.

DEINE ROLLE:
- Du beantwortest Fragen zu Verträgen, Klauseln, Risiken und rechtlichen Zusammenhängen
- Du erklärst juristische Begriffe verständlich aber präzise
- Du gibst konkrete, umsetzbare Handlungsempfehlungen
- Du weist auf DSGVO-, Compliance- und Governance-Aspekte hin

KOMMUNIKATIONSSTIL:
- Professionell und klar, nie umgangssprachlich
- Strukturiere längere Antworten mit Überschriften und Aufzählungen
- Wenn du auf Risiken hinweist, gib immer auch eine Empfehlung
- Verweise auf relevante Gesetzesgrundlagen (BGB, DSGVO, HGB etc.)
- Bei Unsicherheiten sage explizit, dass eine anwaltliche Prüfung empfohlen wird

EINSCHRÄNKUNGEN:
- Du bist kein Rechtsanwalt und gibst keine Rechtsberatung
- Du weist darauf hin, wenn eine Frage über allgemeine Informationen hinausgeht
- Du spekulierst nicht über Rechtsprechung, die du nicht kennst

Antworte immer auf Deutsch.`

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  const body = await request.json()
  const { messages, contractContext } = body as {
    messages: Array<{ role: string; content: string }>
    contractContext?: string
  }

  if (!messages?.length) {
    return NextResponse.json({ error: "Keine Nachricht" }, { status: 400 })
  }

  // Build conversation with optional contract context
  let systemPrompt = SYSTEM_PROMPT
  if (contractContext) {
    systemPrompt += `\n\nAKTUELLER VERTRAGSKONTEXT:\nDer Nutzer hat folgenden Vertrag geladen. Beziehe dich bei Fragen darauf:\n\n${contractContext}`
  }

  // Determine which provider to use
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  if (anthropicKey) {
    // Primary: Claude Sonnet 4 — best reasoning for legal analysis
    try {
      const Anthropic = (await import("@anthropic-ai/sdk")).default
      const client = new Anthropic({ apiKey: anthropicKey })

      const stream = await client.messages.stream({
        model: process.env.ANTHROPIC_CHAT_MODEL?.trim() || "claude-sonnet-4-20250514",
        max_tokens: 4096,
        temperature: 0.3,
        system: systemPrompt,
        messages: messages.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content
        }))
      })

      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of stream) {
              if (event.type === "content_block_delta" && "delta" in event && "text" in event.delta) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text, model: "claude-sonnet-4" })}\n\n`))
              }
            }
            const finalMessage = await stream.finalMessage()
            const tokens = (finalMessage.usage?.input_tokens ?? 0) + (finalMessage.usage?.output_tokens ?? 0)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, model: "claude-sonnet-4", tokens })}\n\n`))
            controller.close()
          } catch (err) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err instanceof Error ? err.message : "Stream error" })}\n\n`))
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
      console.error("[COPILOT] Claude error, falling back to OpenAI:", e)
    }
  }

  if (openaiKey) {
    // Fallback: GPT-4o
    try {
      const OpenAI = (await import("openai")).default
      const client = new OpenAI({ apiKey: openaiKey })

        const allMessages: Array<{role: "system" | "user" | "assistant"; content: string}> = [
          { role: "system", content: systemPrompt },
          ...messages.map(m => ({ role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant", content: m.content }))
        ]

      const stream = await client.chat.completions.create({
        model: process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-4o",
        max_tokens: 4096,
        temperature: 0.3,
        stream: true,
        messages: allMessages
      })

      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream as AsyncIterable<{choices: Array<{delta?: {content?: string}}>}>) {
              const text = chunk.choices[0]?.delta?.content
              if (text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text, model: "gpt-4o" })}\n\n`))
              }
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, model: "gpt-4o" })}\n\n`))
            controller.close()
          } catch (err) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err instanceof Error ? err.message : "Stream error" })}\n\n`))
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
      console.error("[COPILOT] OpenAI error:", e)
    }
  }

  return NextResponse.json({ error: "Kein KI-Provider verfügbar" }, { status: 503 })
}
