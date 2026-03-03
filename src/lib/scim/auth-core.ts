export function requireScimAuth(request: Request) {
  const token = process.env.SCIM_BEARER_TOKEN
  if (!token) {
    return { ok: false as const, status: 500, error: "SCIM_BEARER_TOKEN not configured" }
  }

  const header = request.headers.get("authorization") ?? ""
  const m = header.match(/^Bearer\s+(.+)$/i)
  const provided = m?.[1]?.trim()

  if (!provided || provided !== token) {
    return { ok: false as const, status: 401, error: "Unauthorized" }
  }

  return { ok: true as const }
}
