import { NextResponse } from "next/server"
import { z } from "zod"

import { requireScimAuth } from "@/lib/scim/auth-core"
import { prisma } from "@/lib/prisma"

const createUserSchema = z.object({
  userName: z.string().min(1), // usually email
  externalId: z.string().optional(),
  active: z.boolean().optional(),
  name: z
    .object({
      givenName: z.string().optional(),
      familyName: z.string().optional()
    })
    .optional(),
  emails: z.array(z.object({ value: z.string().email() })).optional()
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

export async function GET(request: Request) {
  const auth = requireScimAuth(request)
  if (!auth.ok) return NextResponse.json({ detail: auth.error }, { status: auth.status })

  const url = new URL(request.url)
  const startIndex = Math.max(1, Number(url.searchParams.get("startIndex") ?? "1"))
  const count = Math.min(200, Math.max(1, Number(url.searchParams.get("count") ?? "50")))

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    skip: startIndex - 1,
    take: count,
    select: { id: true, email: true, name: true, externalId: true, isActive: true }
  })

  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: users.length,
    startIndex,
    itemsPerPage: users.length,
    Resources: users.map(scimUser)
  })
}

export async function POST(request: Request) {
  const auth = requireScimAuth(request)
  if (!auth.ok) return NextResponse.json({ detail: auth.error }, { status: auth.status })

  const raw = await request.json().catch(() => null)
  const parsed = createUserSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ detail: parsed.error.flatten() }, { status: 400 })
  }

  const email = parsed.data.emails?.[0]?.value ?? parsed.data.userName
  const displayName =
    parsed.data.name?.givenName || parsed.data.name?.familyName
      ? `${parsed.data.name?.givenName ?? ""} ${parsed.data.name?.familyName ?? ""}`.trim()
      : null

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: displayName ?? undefined,
      externalId: parsed.data.externalId ?? undefined,
      isActive: parsed.data.active ?? true
    },
    create: {
      email,
      name: displayName,
      externalId: parsed.data.externalId,
      isActive: parsed.data.active ?? true
    },
    select: { id: true, email: true, name: true, externalId: true, isActive: true }
  })

  return NextResponse.json(scimUser(user), { status: 201 })
}
