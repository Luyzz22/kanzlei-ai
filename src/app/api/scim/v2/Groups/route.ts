import { NextResponse } from "next/server"

import { requireScimAuth } from "@/lib/scim/auth-core"
import { checkScimRateLimit } from "@/lib/scim/rate-limit"
import { scimError } from "@/lib/scim/response"
import { logEvent } from "@/lib/observability"

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
  if (!auth.ok) return scimError(auth.status, auth.error)

  const rate = checkScimRateLimit(auth.ip)
  if (!rate.ok) return scimError(429, "Too Many Requests")

  const groups = groupsFromEnv().map((g) => ({
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
    id: g.id,
    displayName: g.displayName,
    members: []
  }))

  logEvent({ event: "scim.groups.list", source: "scim", outcome: "success", ip: auth.ip, meta: { count: groups.length } })

  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: groups.length,
    startIndex: 1,
    itemsPerPage: groups.length,
    Resources: groups
  })
}
