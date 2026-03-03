import { NextResponse } from "next/server"
import { requireScimAuth } from "@/lib/scim/auth-core"

export async function GET(request: Request) {
  const auth = requireScimAuth(request)
  if (!auth.ok) return NextResponse.json({ detail: auth.error }, { status: auth.status })

  return NextResponse.json({
    Resources: [
      {
        id: "urn:ietf:params:scim:schemas:core:2.0:User",
        name: "User",
        description: "Core User",
        schema: "urn:ietf:params:scim:schemas:core:2.0:User",
        attributes: []
      }
    ],
    itemsPerPage: 1,
    startIndex: 1,
    totalResults: 1,
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"]
  })
}
