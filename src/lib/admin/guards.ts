import "server-only"

import { Role, type User } from "@prisma/client"

import { auth } from "@/lib/auth"

export type AdminGuardResult =
  | { ok: true; user: Pick<User, "id" | "role"> }
  | { ok: false; status: 401 | 403; message: string }

export async function requireAdminAccess(): Promise<AdminGuardResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return { ok: false, status: 401, message: "Nicht autorisiert" }
  }

  if (session.user.role !== Role.ADMIN) {
    return { ok: false, status: 403, message: "Zugriff nur für Administratoren" }
  }

  return { ok: true, user: { id: session.user.id, role: session.user.role } }
}
