import { NextResponse } from "next/server"

const SCIM_ERROR_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:Error"

export function scimError(status: number, detail: string) {
  return NextResponse.json(
    {
      schemas: [SCIM_ERROR_SCHEMA],
      detail,
      status: String(status)
    },
    { status }
  )
}
