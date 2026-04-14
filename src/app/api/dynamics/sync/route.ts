import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

async function getEntraToken(tenantId: string, clientId: string, clientSecret: string): Promise<string> {
  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://api.businesscentral.dynamics.com/.default",
      grant_type: "client_credentials",
    }),
  })
  if (!res.ok) throw new Error(`Entra token failed: ${res.status}`)
  const data = await res.json()
  return data.access_token
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { entity, tenantId, clientId, clientSecret, environment, companyId } = await req.json()
    if (!entity || !tenantId || !clientId || !clientSecret || !environment || !companyId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const valid = ["vendors", "purchaseOrders", "purchaseInvoices"]
    if (!valid.includes(entity)) return NextResponse.json({ error: "Invalid entity" }, { status: 400 })

    const token = await getEntraToken(tenantId, clientId, clientSecret)
    const url = `https://api.businesscentral.dynamics.com/v2.0/${environment}/api/v2.0/companies(${companyId})/${entity}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } })
    if (!res.ok) throw new Error(`Dynamics API: ${res.status}`)
    const data = await res.json()

    return NextResponse.json({ success: true, entity, count: (data.value ?? []).length, syncedAt: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown" }, { status: 500 })
  }
}
