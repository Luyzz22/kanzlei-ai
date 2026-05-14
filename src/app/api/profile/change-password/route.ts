export const dynamic = "force-dynamic"

import { compare, hash } from "bcryptjs"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeAuditEvent } from "@/lib/audit-core"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body as {
      currentPassword?: string
      newPassword?: string
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Aktuelles und neues Passwort sind erforderlich." },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Das neue Passwort muss mindestens 8 Zeichen lang sein." },
        { status: 400 }
      )
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "Das neue Passwort muss sich vom aktuellen unterscheiden." },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true, email: true }
    })

    if (!user) {
      return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 })
    }

    if (!user.password) {
      return NextResponse.json(
        { error: "Passwort\u00e4nderung nicht m\u00f6glich \u2014 Ihr Konto nutzt SSO-Authentifizierung." },
        { status: 400 }
      )
    }

    const isValid = await compare(currentPassword, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: "Das aktuelle Passwort ist nicht korrekt." },
        { status: 403 }
      )
    }

    const passwordHash = await hash(newPassword, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash }
    })

    // Audit Event
    const tenantContext = await resolveTenantContextForUser(user.id)
    if (tenantContext.status === "single") {
      await writeAuditEvent({
        tenantId: tenantContext.tenantId,
        actorId: user.id,
        action: "user.password.changed",
        resourceType: "user",
        resourceId: user.id,
        metadata: { email: user.email }
      })
    }

    return NextResponse.json({ status: "success", message: "Passwort wurde erfolgreich ge\u00e4ndert." })
  } catch (error) {
    console.error("[profile.change_password] Error:", error)
    return NextResponse.json(
      { error: "Passwort\u00e4nderung fehlgeschlagen. Bitte versuchen Sie es erneut." },
      { status: 500 }
    )
  }
}
