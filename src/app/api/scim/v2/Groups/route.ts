import { NextResponse } from "next/server"

import { requireScimAuth } from "@/lib/scim/auth-core"

function groupsFromEnv() {
  const admin = process.env.SCIM_GROUP_ADMIN ?? "KanzleiAI.Admin"
  const anwalt = process.env.SCIM_GROUP_ANWALT ?? "KanzleiAI.Anwalt"
  const assistent = process.env.SCIM_GROUP_ASSISTENT ?? "KanzleiAI.Assistent"

  return [
    { id: "admin", displayName: admin },
    { id: "anwalt", displayName: anwalt },
    { id: "assistent", displayName: assistent }
  ]
}

export async function GET(request: Request) {
  const auth = requireScimAuth(request)
  if (!auth.ok) return NextResponse.json({ detail: auth.error }, { status: auth.status })

  const groups = groupsFromEnv().map((g) => ({
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
    id: g.id,
    displayName: g.displayName,
    members: []
  }))

  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: groups.length,
    startIndex: 1,
    itemsPerPage: groups.length,
    Resources: groups
  })
}
