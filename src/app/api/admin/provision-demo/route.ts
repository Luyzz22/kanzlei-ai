export const dynamic = "force-dynamic"

import { hash } from "bcryptjs"
import { NextResponse } from "next/server"
import { Role, TenantRole } from "@prisma/client"

import { prisma } from "@/lib/prisma"

export async function POST(request: Request): Promise<NextResponse> {
  const seedSecret = process.env.SEED_SECRET
  if (!seedSecret) {
    return NextResponse.json({ error: "SEED_SECRET not configured" }, { status: 503 })
  }
  const authHeader = request.headers.get("x-seed-secret")
  if (authHeader !== seedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { email, password, name, company } = body as {
      email: string; password: string; name: string; company: string
    }

    if (!email || !password || !name || !company) {
      return NextResponse.json({ error: "Alle Felder erforderlich: email, password, name, company" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ status: "exists", message: `User ${email} existiert bereits`, userId: existing.id })
    }

    const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    const passwordHash = await hash(password, 12)

    const tenant = await prisma.tenant.upsert({
      where: { slug },
      update: { name: company },
      create: { slug, name: company }
    })

    const user = await prisma.user.create({
      data: { name, email, password: passwordHash, role: Role.ANWALT, emailVerified: new Date() }
    })

    await prisma.tenantMember.create({
      data: { tenantId: tenant.id, userId: user.id, role: TenantRole.MEMBER }
    })

    return NextResponse.json({
      status: "provisioned",
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
      access: {
        login: "https://www.kanzlei-ai.com/login",
        features: ["Schnellanalyse", "Contract Copilot", "Vertragskontext-Chat"],
        restrictions: ["Kein Admin-Zugang", "Eigener Mandant (isoliert)"]
      }
    })
  } catch (error) {
    console.error("[PROVISION-DEMO] Error:", error)
    return NextResponse.json({ error: "Provisioning failed", details: error instanceof Error ? error.message : "unknown" }, { status: 500 })
  }
}
