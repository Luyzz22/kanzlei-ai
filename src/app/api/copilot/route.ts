export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { createAnthropicClient, claudeConfigured } from "@/lib/ai/anthropic-client"
import { activeClaudeModelId } from "@/lib/ai/claude-model-config"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { COPILOT_LIMIT, checkRateLimit, retryAfterSeconds } from "@/lib/security/rate-limit"
import { log } from "@/lib/security/secure-logging"
import { trackTokenUsage } from "@/lib/token-tracking"

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

const MAX_HISTORY_TURNS = 5

type Message = { role: string; content: string }

/**
 * Sliding-window context trimmer — keeps the last MAX_HISTORY_TURNS user/assistant
 * pairs plus a compact summary of older turns. Reduces input tokens on long sessions
 * from ~55k (turn 15) to a constant ~20k, cutting Copilot cost by ~60%.
 */
function trimConversationHistory(messages: Message[]): Message[] {
  const system = messages.filter((m) => m.role === "system")
  const conversation = messages.filter((m) => m.role !== "system")

  if (conversation.length <= MAX_HISTORY_TURNS * 2) return messages

  const oldTurns = conversation.slice(0, -(MAX_HISTORY_TURNS * 2))
  const recentTurns = conversation.slice(-(MAX_HISTORY_TURNS * 2))

  const topics = oldTurns
    .filter((m) => m.role === "user")
    .map((m) => m.content.slice(0, 80))
    .join("; ")

  const summary: Message = {
    role: "user",
    content: `[Bisherige Diskussion (${Math.floor(oldTurns.length / 2)} Fragen): ${topics}]`
  }
  const ack: Message = { role: "assistant", content: "Kontext übernommen." }

  return [...system, summary, ack, ...recentTurns]
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  // Tenant context for rate-limit keying and token tracking
  const tenantCtx = await resolveTenantContextForUser(session.user.id)
  const tenantId = tenantCtx.status === "single" ? tenantCtx.tenantId : session.user.id

  // Rate limit: 30 questions/hour per user (LLM cost protection)
  const rl = checkRateLimit(`copilot:${tenantId}:${session.user.id}`, COPILOT_LIMIT)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Copilot-Limit erreicht. Bitte in einer Stunde erneut versuchen." },
      { status: 429, headers: { "Retry-After": retryAfterSeconds(rl.retryAfterMs) } }
    )
  }

  const body = await request.json()
  const { messages, contractContext } = body as {
    messages: Array<{ role: string; content: string }>
    contractContext?: string
  }

  if (!messages?.length) {
    return NextResponse.json({ error: "Keine Nachricht" }, { status: 400 })
  }

  // Build system prompt with optional contract context
  let systemPrompt = SYSTEM_PROMPT
  if (contractContext) {
    systemPrompt += `\n\nAKTUELLER VERTRAGSKONTEXT:\nDer Nutzer hat folgenden Vertrag geladen. Beziehe dich bei Fragen darauf:\n\n${contractContext}`
  }

  // Apply sliding-window trim to reduce input tokens on long sessions
  const trimmedMessages = trimConversationHistory(messages)

  // Kein Provider-Fallback: nach ADR-0001 ist Claude (direkt oder über Bedrock
  // EU) der einzige zugelassene externe Pfad. Ein Ausweichen auf einen anderen
  // Anbieter wäre ein Sicherheits-Downgrade und ist deshalb entfallen.
  if (claudeConfigured()) {
    try {
      const client = await createAnthropicClient()

      const stream = await client.messages.stream({
        model: activeClaudeModelId(),
        max_tokens: 4096,
        temperature: 0.3,
        system: systemPrompt,
        messages: trimmedMessages.map((m) => ({
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
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: event.delta.text, model: "claude-sonnet-4" })}\n\n`)
                )
              }
            }
            const finalMessage = await stream.finalMessage()
            const tokens = (finalMessage.usage?.input_tokens ?? 0) + (finalMessage.usage?.output_tokens ?? 0)

            // 3c. Token tracking — structured log, no PII (DSGVO Art. 5(1f))
            log.info("copilot.tokens_used", {
              provider: "anthropic",
              inputTokens: finalMessage.usage?.input_tokens ?? 0,
              outputTokens: finalMessage.usage?.output_tokens ?? 0,
              totalTokens: tokens,
              historyTurnsOriginal: messages.filter((m) => m.role !== "system").length,
              historyTurnsTrimmed: trimmedMessages.filter((m) => m.role !== "system").length
            })
            void trackTokenUsage({
              tenantId,
              userId: session.user.id,
              source: "copilot",
              provider: "anthropic",
              inputTokens: finalMessage.usage?.input_tokens ?? 0,
              outputTokens: finalMessage.usage?.output_tokens ?? 0
            })

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ done: true, model: "claude-sonnet-4", tokens })}\n\n`)
            )
            controller.close()
          } catch (err) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ error: err instanceof Error ? "Stream-Fehler" : "Unbekannter Fehler" })}\n\n`
              )
            )
            controller.close()
          }
        }
      })

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        }
      })
    } catch {
      log.warn("copilot.anthropic_failed", { code: "ANTHROPIC_ERROR" })
    }
  }

  return NextResponse.json({ error: "Kein KI-Provider verfügbar" }, { status: 503 })
}
