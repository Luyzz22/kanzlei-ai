export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"

export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: "Not configured" }, { status: 503 })
  try {
    const body = await request.text()
    const event = JSON.parse(body) as { type: string; data: { object: Record<string, unknown> } }
    console.log(`[STRIPE WEBHOOK] ${event.type}`)
    switch (event.type) {
      case "checkout.session.completed":
        console.log(`[STRIPE] Checkout: ${event.data.object.customer_email}`)
        break
      case "customer.subscription.deleted":
        console.log(`[STRIPE] Sub cancelled: ${event.data.object.id}`)
        break
      case "invoice.payment_failed":
        console.log(`[STRIPE] Payment failed: ${event.data.object.customer}`)
        break
    }
    return NextResponse.json({ received: true })
  } catch (e) {
    console.error("[STRIPE WEBHOOK]", e)
    return NextResponse.json({ error: "Failed" }, { status: 400 })
  }
}
