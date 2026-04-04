export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"

// Webhook configuration stored in memory (future: DB)
// This endpoint receives internal events and forwards to configured URLs
type WebhookEvent = {
  type: "analysis.completed" | "analysis.high_risk" | "export.created" | "user.login"
  data: Record<string, unknown>
  timestamp: string
  tenantId?: string
}

export async function POST(request: Request): Promise<NextResponse> {
  const apiKey = request.headers.get("x-api-key")
  if (apiKey !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const event = await request.json() as WebhookEvent
    event.timestamp = new Date().toISOString()

    console.log(`[WEBHOOK] ${event.type}`, JSON.stringify(event.data).slice(0, 200))

    // Forward to n8n if configured
    const n8nUrl = process.env.N8N_WEBHOOK_URL
    if (n8nUrl) {
      fetch(n8nUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      }).catch(err => console.error("[WEBHOOK→n8n]", err))
    }

    // Forward to Slack if configured
    const slackUrl = process.env.SLACK_WEBHOOK_URL
    if (slackUrl && event.type === "analysis.high_risk") {
      const riskScore = (event.data as Record<string, number>).riskScore
      fetch(slackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `⚠️ Hochrisiko-Vertrag erkannt (Score: ${riskScore}/100) — ${(event.data as Record<string, string>).product}`,
        }),
      }).catch(err => console.error("[WEBHOOK→Slack]", err))
    }

    return NextResponse.json({ received: true, type: event.type })
  } catch (error) {
    console.error("[WEBHOOK]", error)
    return NextResponse.json({ error: "Failed" }, { status: 400 })
  }
}
