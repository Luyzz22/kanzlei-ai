import bcrypt from "bcryptjs"
import { PrismaClient, Role, TenantRole } from "@prisma/client"

const prisma = new PrismaClient()

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

    console.log(`✅ Seed verarbeitet (Tenant=${tenant.slug}): ${user.email} (${user.role})`)
  } catch (error) {
    console.error("❌ Fehler beim Seeding:", error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

void seedAdminUser()
