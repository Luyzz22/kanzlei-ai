export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"

import { log } from "@/lib/security/secure-logging"

export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: "Not configured" }, { status: 503 })
  try {
    const body = await request.text()
    const event = JSON.parse(body) as { type: string; data: { object: Record<string, unknown> } }
    log.info("stripe.webhook.received", { eventType: event.type })
    // No PII (customer_email, customer id) in logs — DSGVO Art. 5(1f)
    return NextResponse.json({ received: true })
  } catch {
    log.error("stripe.webhook.failed", { code: "PARSE_ERROR" })
    return NextResponse.json({ error: "Failed" }, { status: 400 })
  }
}
