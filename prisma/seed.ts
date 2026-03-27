import bcrypt from "bcryptjs"
import {
  PrismaClient,
  PromptDefinitionStatus,
  PromptTaskStage,
  Role,
  TenantRole
} from "@prisma/client"

const prisma = new PrismaClient()

/** Synchron zu src/lib/ai/schemas/contract-analysis.ts */
const SEED_PROMPT_VERSION = "2025-03-27"

async function seedPromptGovernanceBaseline(): Promise<void> {
  const extraction = await prisma.promptDefinition.upsert({
    where: { key_version: { key: "contract.extraction.default", version: SEED_PROMPT_VERSION } },
    create: {
      key: "contract.extraction.default",
      version: SEED_PROMPT_VERSION,
      purpose: "Strukturierte Vertragsextraktion (Seed-Baseline)",
      status: PromptDefinitionStatus.ACTIVE
    },
    update: { status: PromptDefinitionStatus.ACTIVE }
  })
  const risk = await prisma.promptDefinition.upsert({
    where: { key_version: { key: "contract.risk_guidance.default", version: SEED_PROMPT_VERSION } },
    create: {
      key: "contract.risk_guidance.default",
      version: SEED_PROMPT_VERSION,
      purpose: "Risiko- und Handlungsempfehlungen (Seed-Baseline)",
      status: PromptDefinitionStatus.ACTIVE
    },
    update: { status: PromptDefinitionStatus.ACTIVE }
  })

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
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

async function seedAdminUser(): Promise<void> {
  // Required
  const adminEmail = requireEnv("SEED_ADMIN_EMAIL")
  const adminPassword = requireEnv("SEED_ADMIN_PASSWORD")
  const tenantSlug = requireEnv("SEED_TENANT_SLUG")

  // Optional
  const adminName = process.env.SEED_ADMIN_NAME ?? "Admin"
  const tenantName = process.env.SEED_TENANT_NAME ?? "Default Tenant"

  try {
    const passwordHash = await bcrypt.hash(adminPassword, 12)

    const tenant = await prisma.tenant.upsert({
      where: { slug: tenantSlug },
      update: { name: tenantName },
      create: { slug: tenantSlug, name: tenantName }
    })

    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        name: adminName,
        role: Role.ADMIN,
        password: passwordHash
      },
      create: {
        name: adminName,
        email: adminEmail,
        password: passwordHash,
        role: Role.ADMIN
      }
    })

    await prisma.tenantMember.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
      update: { role: TenantRole.OWNER },
      create: { tenantId: tenant.id, userId: user.id, role: TenantRole.OWNER }
    })

    await seedPromptGovernanceBaseline()

    console.log(`✅ Seed verarbeitet (Tenant=${tenant.slug}): ${user.email} (${user.role})`)
  } catch (error) {
    console.error("❌ Fehler beim Seeding:", error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

void seedAdminUser()
