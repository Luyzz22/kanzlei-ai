import { NextResponse } from "next/server"

import { requireScimAuth } from "@/lib/scim/auth-core"
import { checkScimRateLimit } from "@/lib/scim/rate-limit"
import { scimError } from "@/lib/scim/response"

export async function GET(request: Request) {
  const auth = requireScimAuth(request)
  if (!auth.ok) return scimError(auth.status, auth.error)

  const rate = checkScimRateLimit(auth.ip)
  if (!rate.ok) return scimError(429, "Too Many Requests")

  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig"],
    patch: { supported: true },
    bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
    filter: { supported: true, maxResults: 200 },
    changePassword: { supported: false },
    sort: { supported: false },
    etag: { supported: false },
    authenticationSchemes: [
      {
        type: "oauthbearertoken",
        name: "Bearer Token",
        description: "Static bearer token configured in SCIM_BEARER_TOKEN",
        specUri: "urn:ietf:params:scim:api:messages:2.0:SearchRequest",
        primary: true
      }
    ]
  })
}
