export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const PRICES: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || "",
  business: process.env.STRIPE_PRICE_BUSINESS || "",
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) return NextResponse.json({ error: "Stripe nicht konfiguriert", redirect: "/enterprise-kontakt" }, { status: 503 })

  const { plan } = await request.json() as { plan: string }
  const priceId = PRICES[plan]
  if (!priceId) return NextResponse.json({ error: "Plan nicht verfügbar", redirect: "/enterprise-kontakt" }, { status: 400 })

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        mode: "subscription",
        customer_email: session.user.email,
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        success_url: `https://www.kanzlei-ai.com/dashboard?checkout=success&plan=${plan}`,
        cancel_url: "https://www.kanzlei-ai.com/preise?checkout=cancelled",
        "metadata[userId]": session.user.id,
        "metadata[plan]": plan,
        allow_promotion_codes: "true",
      }).toString()
    })
    const checkout = await res.json()
    if (!res.ok) { console.error("[STRIPE]", checkout); return NextResponse.json({ error: "Checkout fehlgeschlagen" }, { status: 500 }) }
    return NextResponse.json({ url: checkout.url })
  } catch (e) {
    console.error("[STRIPE]", e)
    return NextResponse.json({ error: "Stripe-Fehler" }, { status: 500 })
  }
}
