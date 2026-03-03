import { NextResponse } from "next/server"
import { z } from "zod"
import { Role, TenantRole } from "@prisma/client"

import { requireScimAuth } from "@/lib/scim/auth-core"
import { requireScimTenant } from "@/lib/scim/tenant-core"
import { prisma } from "@/lib/prisma"
import { withTenant } from "@/lib/tenant-context-core"
import { writeAuditEventTx } from "@/lib/audit-write"

const patchSchema = z.object({
  Operations: z.array(
    z.object({
      op: z.string(),
      path: z.string().optional(),
      value: z.any().optional() // SCIM patch payload is flexible
    })
  )
})

function groupConfig(id: string) {
  const admin = process.env.SCIM_GROUP_ADMIN ?? "KanzleiAI.Admin"
  const anwalt = process.env.SCIM_GROUP_ANWALT ?? "KanzleiAI.Anwalt"
  const assistent = process.env.SCIM_GROUP_ASSISTENT ?? "KanzleiAI.Assistent"

  if (id === "admin") return { id, displayName: admin, userRole: Role.ADMIN, tenantRole: TenantRole.ADMIN }
  if (id === "anwalt") return { id, displayName: anwalt, userRole: Role.ANWALT, tenantRole: TenantRole.MEMBER }
  if (id === "assistent") return { id, displayName: assistent, userRole: Role.ASSISTENT, tenantRole: TenantRole.MEMBER }
  return null
}

function scimGroup(id: string, displayName: string) {
  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
    id,
    displayName,
    members: []
  }
}

async function resolveUserId(value: string): Promise<string | null> {
  if (!value) return null
  if (value.includes("@")) {
    const u = await prisma.user.findUnique({ where: { email: value }, select: { id: true } })
    return u?.id ?? null
  }
  const u = await prisma.user.findUnique({ where: { id: value }, select: { id: true } })
  return u?.id ?? null
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = requireScimAuth(request)
  if (!auth.ok) return NextResponse.json({ detail: auth.error }, { status: auth.status })

  const cfg = groupConfig(params.id)
  if (!cfg) return NextResponse.json({ detail: "Not found" }, { status: 404 })

  return NextResponse.json(scimGroup(cfg.id, cfg.displayName))
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = requireScimAuth(request)
  if (!auth.ok) return NextResponse.json({ detail: auth.error }, { status: auth.status })

  const cfg = groupConfig(params.id)
  if (!cfg) return NextResponse.json({ detail: "Not found" }, { status: 404 })

  const tenantRes = await requireScimTenant()
  if (!tenantRes.ok) return NextResponse.json({ detail: tenantRes.error }, { status: tenantRes.status })
  const tenantId = tenantRes.tenant.id

  const raw = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ detail: parsed.error.flatten() }, { status: 400 })

  // Extract members from PATCH operations (additive)
  const members: string[] = []
  for (const op of parsed.data.Operations) {
    const opName = op.op.toLowerCase()
    const path = op.path?.toLowerCase()
    if (!["add", "replace"].includes(opName)) continue
    if (path && path !== "members") continue

    const val = op.value
    if (Array.isArray(val)) {
      for (const m of val) {
        const v = typeof m?.value === "string" ? m.value : typeof m === "string" ? m : null
        if (v) members.push(v)
      }
    } else if (val?.members && Array.isArray(val.members)) {
      for (const m of val.members) {
        const v = typeof m?.value === "string" ? m.value : null
        if (v) members.push(v)
      }
    }
  }

  const unique = Array.from(new Set(members))
  const resolved: string[] = []
  for (const v of unique) {
    const uid = await resolveUserId(v)
    if (uid) resolved.push(uid)
  }

  await withTenant(tenantId, async (tx) => {
    for (const userId of resolved) {
      await tx.tenantMember.upsert({
        where: { tenantId_userId: { tenantId, userId } },
        update: { role: cfg.tenantRole },
        create: { tenantId, userId, role: cfg.tenantRole }
      })
      await tx.user.update({ where: { id: userId }, data: { role: cfg.userRole } }).catch(() => null)
    }

    await writeAuditEventTx(tx, {
      tenantId,
      actorId: null,
      action: "scim.group.patch",
      resourceType: "group",
      resourceId: cfg.id,
      requestId: `scim-${cfg.id}-${Date.now()}`,
      metadata: { membersReceived: unique.length, membersResolved: resolved.length }
    })
  })

  return NextResponse.json(scimGroup(cfg.id, cfg.displayName))
}
