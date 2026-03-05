import { NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { requireScimAuth } from "@/lib/scim/auth-core"
import { checkScimRateLimit } from "@/lib/scim/rate-limit"
import { scimError } from "@/lib/scim/response"
import { logEvent } from "@/lib/observability"

const patchSchema = z.object({
  Operations: z.array(
    z.object({
      op: z.string(),
      path: z.string().optional(),
      value: z.any().optional()
    })
  )
})

function scimUser(u: { id: string; email: string; name: string | null; externalId: string | null; isActive: boolean }) {
  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    id: u.id,
    userName: u.email,
    externalId: u.externalId,
    active: u.isActive,
    displayName: u.name ?? undefined,
    emails: [{ value: u.email, primary: true }]
  }
}

function enforce(request: Request) {
  const auth = requireScimAuth(request)
  if (!auth.ok) return { error: scimError(auth.status, auth.error) }

  const rate = checkScimRateLimit(auth.ip)
  if (!rate.ok) return { error: scimError(429, "Too Many Requests") }

  return { ip: auth.ip }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const gate = enforce(request)
  if ("error" in gate) return gate.error

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, email: true, name: true, externalId: true, isActive: true }
  })
  if (!user) return scimError(404, "Not found")

  return NextResponse.json(scimUser(user))
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const gate = enforce(request)
  if ("error" in gate) return gate.error

  const raw = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(raw)
  if (!parsed.success) return scimError(400, "Invalid SCIM patch payload")

  let active: boolean | undefined
  let externalId: string | undefined

  for (const op of parsed.data.Operations) {
    const opName = op.op.toLowerCase()
    if (!["add", "replace"].includes(opName)) continue

    if (op.path?.toLowerCase() === "active") active = Boolean(op.value)
    if (op.path?.toLowerCase() === "externalid") externalId = String(op.value)
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(active !== undefined ? { isActive: active } : {}),
      ...(externalId !== undefined ? { externalId } : {})
    },
    select: { id: true, email: true, name: true, externalId: true, isActive: true }
  })

  logEvent({ event: "scim.user.patch", source: "scim", outcome: "success", ip: gate.ip, meta: { userId: user.id } })
  return NextResponse.json(scimUser(user))
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const gate = enforce(request)
  if ("error" in gate) return gate.error

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { isActive: false },
    select: { id: true, email: true, name: true, externalId: true, isActive: true }
  })

  logEvent({ event: "scim.user.deactivate", source: "scim", outcome: "success", ip: gate.ip, meta: { userId: user.id } })
  return NextResponse.json(scimUser(user))
}
