import { NextResponse } from "next/server"
import { z } from "zod"

import { requireScimAuth } from "@/lib/scim/auth-core"
import { prisma } from "@/lib/prisma"

const patchSchema = z.object({
  Operations: z.array(
    z.object({
      op: z.string(),
      path: z.string().optional(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = requireScimAuth(request)
  if (!auth.ok) return NextResponse.json({ detail: auth.error }, { status: auth.status })

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, email: true, name: true, externalId: true, isActive: true }
  })
  if (!user) return NextResponse.json({ detail: "Not found" }, { status: 404 })

  return NextResponse.json(scimUser(user))
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = requireScimAuth(request)
  if (!auth.ok) return NextResponse.json({ detail: auth.error }, { status: auth.status })

  const raw = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ detail: parsed.error.flatten() }, { status: 400 })

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

  return NextResponse.json(scimUser(user))
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = requireScimAuth(request)
  if (!auth.ok) return NextResponse.json({ detail: auth.error }, { status: auth.status })

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { isActive: false },
    select: { id: true, email: true, name: true, externalId: true, isActive: true }
  })

  return NextResponse.json(scimUser(user))
}
