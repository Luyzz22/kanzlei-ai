import bcrypt from "bcryptjs"
import { PrismaClient, Role } from "@prisma/client"

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

  // Optional
  const adminName = process.env.SEED_ADMIN_NAME ?? "Admin"

  try {
    const passwordHash = await bcrypt.hash(adminPassword, 12)

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

    console.log(`✅ Admin-Seed verarbeitet: ${user.email} (${user.role})`)
  } catch (error) {
    console.error("❌ Fehler beim Admin-Seeding:", error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

void seedAdminUser()
