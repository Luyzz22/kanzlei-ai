export const dynamic = "force-dynamic"

import { hash } from "bcryptjs"
import { NextResponse } from "next/server"
import { PromptDefinitionStatus, PromptTaskStage, Role, TenantRole } from "@prisma/client"

import { prisma } from "@/lib/prisma"

const SEED_PROMPT_VERSION = "2025-03-27"

export async function POST(request: Request): Promise<NextResponse> {
  // Auth: requires SEED_SECRET in header
  const seedSecret = process.env.SEED_SECRET
  if (!seedSecret) {
    return NextResponse.json(
      { error: "SEED_SECRET not configured on server" },
      { status: 503 }
    )
  }

  const authHeader = request.headers.get("x-seed-secret")
  if (authHeader !== seedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: Role.ADMIN }
  })

  if (existingAdmin) {
    return NextResponse.json(
      {
        status: "already_seeded",
        message: "Admin user already exists",
        email: existingAdmin.email
      },
      { status: 200 }
    )
  }

  try {
    const body = await request.json()
    const email = body.email || "luis@sbsdeutschland.de"
    const password = body.password || "KanzleiAI2026!"
    const name = body.name || "Luis Schenk"
    const tenantName = body.tenantName || "SBS Deutschland"
    const tenantSlug = body.tenantSlug || "sbs-deutschland"

    const passwordHash = await hash(password, 12)

    // Create tenant
    const tenant = await prisma.tenant.upsert({
      where: { slug: tenantSlug },
      update: { name: tenantName },
      create: { slug: tenantSlug, name: tenantName }
    })

    // Create admin user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        role: Role.ADMIN
      }
    })

    // Create tenant membership
    await prisma.tenantMember.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        role: TenantRole.OWNER
      }
    })

    // Seed prompt governance baseline (optional — tables may not exist yet)
    let promptStatus = "skipped"
    try {
      const extraction = await prisma.promptDefinition.upsert({
        where: {
          key_version: {
            key: "contract.extraction.default",
            version: SEED_PROMPT_VERSION
          }
        },
        create: {
          key: "contract.extraction.default",
          version: SEED_PROMPT_VERSION,
          purpose: "Strukturierte Vertragsextraktion (Seed-Baseline)",
          status: PromptDefinitionStatus.ACTIVE
        },
        update: { status: PromptDefinitionStatus.ACTIVE }
      })

      const risk = await prisma.promptDefinition.upsert({
        where: {
          key_version: {
            key: "contract.risk_guidance.default",
            version: SEED_PROMPT_VERSION
          }
        },
        create: {
          key: "contract.risk_guidance.default",
          version: SEED_PROMPT_VERSION,
          purpose: "Risiko- und Handlungsempfehlungen (Seed-Baseline)",
          status: PromptDefinitionStatus.ACTIVE
        },
        update: { status: PromptDefinitionStatus.ACTIVE }
      })

      // Create prompt releases
      const hasExtRelease = await prisma.promptRelease.findFirst({
        where: {
          taskStage: PromptTaskStage.EXTRACTION,
          tenantId: null,
          contractTypePattern: "*",
          promptDefinitionId: extraction.id,
          active: true
        }
      })
      if (!hasExtRelease) {
        await prisma.promptRelease.create({
          data: {
            taskStage: PromptTaskStage.EXTRACTION,
            contractTypePattern: "*",
            promptDefinitionId: extraction.id,
            tenantId: null,
            active: true
          }
        })
      }

      const hasRiskRelease = await prisma.promptRelease.findFirst({
        where: {
          taskStage: PromptTaskStage.RISK_AND_GUIDANCE,
          tenantId: null,
          contractTypePattern: "*",
          promptDefinitionId: risk.id,
          active: true
        }
      })
      if (!hasRiskRelease) {
        await prisma.promptRelease.create({
          data: {
            taskStage: PromptTaskStage.RISK_AND_GUIDANCE,
            contractTypePattern: "*",
            promptDefinitionId: risk.id,
            tenantId: null,
            active: true
          }
        })
      }
      promptStatus = "seeded"
    } catch (promptError) {
      console.warn("[SEED] Prompt governance tables not available yet:", promptError)
      promptStatus = "tables_not_ready"
    }

    return NextResponse.json({
      status: "seeded",
      user: { id: user.id, email: user.email, role: user.role },
      tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
      promptGovernance: promptStatus
    })
  } catch (error) {
    console.error("[SEED] Error:", error)
    return NextResponse.json(
      { error: "Seed failed", details: error instanceof Error ? error.message : "unknown" },
      { status: 500 }
    )
  }
}
