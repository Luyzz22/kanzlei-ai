import bcrypt from "bcryptjs"
import { PrismaClient, Role } from "@prisma/client"

const prisma = new PrismaClient()

async function seedAdminUser(): Promise<void> {
  const adminEmail = "ki@sbsdeutschland.de"

  try {
    const passwordHash = await bcrypt.hash("nexus2026", 12)

    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        name: "Luis Schenk",
        email: adminEmail,
        password: passwordHash,
        role: Role.ADMIN
      }
    })

    console.log(`✅ Admin-Seed erfolgreich verarbeitet: ${user.email} (${user.role})`)
  } catch (error) {
    console.error("❌ Fehler beim Admin-Seeding:", error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

void seedAdminUser()
