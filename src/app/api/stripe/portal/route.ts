export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) return NextResponse.json({ error: "Stripe nicht konfiguriert" }, { status: 503 })

  try {
    const custRes = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(session.user.email)}&limit=1`, {
      headers: { Authorization: `Bearer ${stripeKey}` }
    })
    const customers = await custRes.json()
    if (!customers.data?.length) return NextResponse.json({ error: "Kein Abo gefunden", redirect: "/preise" }, { status: 404 })

    const portalRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ customer: customers.data[0].id, return_url: "https://www.kanzlei-ai.com/dashboard" }).toString()
    })
    const portal = await portalRes.json()
    return NextResponse.json({ url: portal.url })
  } catch (e) {
    console.error("[STRIPE PORTAL]", e)
    return NextResponse.json({ error: "Portal-Fehler" }, { status: 500 })
  }
}
