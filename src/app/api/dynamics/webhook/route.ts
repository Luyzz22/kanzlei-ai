import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const validationToken = url.searchParams.get("validationToken")
    if (validationToken) return new NextResponse(validationToken, { status: 200, headers: { "Content-Type": "text/plain" } })

    const payload = await req.json()
    const resource = (payload.resource ?? "").toLowerCase()

    console.log(`[Dynamics Webhook] ${payload.changeType} on ${resource}`, { id: payload.resourceData?.id })

    if (resource.includes("vendor") && payload.changeType === "created") {
      // TODO: Queue vendor contract analysis
    }
    if (resource.includes("purchaseorder")) {
      // TODO: Validate terms
    }
    if (resource.includes("document")) {
      // TODO: Auto-analyze attachment
    }

    return NextResponse.json({ received: true, timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const validationToken = new URL(req.url).searchParams.get("validationToken")
  if (validationToken) return new NextResponse(validationToken, { status: 200, headers: { "Content-Type": "text/plain" } })
  return NextResponse.json({ status: "Dynamics 365 webhook endpoint active", version: "1.0" })
}
