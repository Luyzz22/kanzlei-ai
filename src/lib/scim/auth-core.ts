import { logEvent } from "@/lib/observability"

function parseCsv(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

function getClientIp(request: Request): string | null {
  const xff = request.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]?.trim() ?? null
  const xri = request.headers.get("x-real-ip")
  if (xri) return xri.trim()
  const cf = request.headers.get("cf-connecting-ip")
  if (cf) return cf.trim()
  return null
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".")
  if (parts.length !== 4) return null
  const nums = parts.map((p) => Number(p))
  if (nums.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null
  return ((nums[0] << 24) >>> 0) + (nums[1] << 16) + (nums[2] << 8) + nums[3]
}

function matchCidr(ip: string, cidr: string): boolean {
  const [net, bitsStr] = cidr.split("/")
  const bits = Number(bitsStr)
  const ipInt = ipv4ToInt(ip)
  const netInt = ipv4ToInt(net)
  if (ipInt === null || netInt === null) return false
  if (Number.isNaN(bits) || bits < 0 || bits > 32) return false
  const mask = bits === 0 ? 0 : (~((1 << (32 - bits)) - 1) >>> 0) >>> 0
  return (ipInt & mask) === (netInt & mask)
}

function ipAllowed(ip: string | null, allow: string[]): boolean {
  if (!allow.length) return true
  if (!ip) return false
  if (allow.includes(ip)) return true

  for (const entry of allow) {
    if (entry.includes("/") && matchCidr(ip, entry)) return true
  }
  return false
}

function configuredTokens(): string[] {
  const multi = parseCsv(process.env.SCIM_BEARER_TOKENS)
  const single = process.env.SCIM_BEARER_TOKEN ? [process.env.SCIM_BEARER_TOKEN] : []
  return multi.length ? multi : single
}

function tokenAllowed(provided: string | null): boolean {
  const tokens = configuredTokens()
  if (!tokens.length || !provided) return false
  return tokens.includes(provided)
}

export function requireScimAuth(request: Request) {
  const allowIps = parseCsv(process.env.SCIM_ALLOWED_IPS)
  const ip = getClientIp(request)

  if (!ipAllowed(ip, allowIps)) {
    logEvent({ event: "scim.auth", source: "scim", outcome: "deny", ip, detail: "ip_forbidden" }, "warn")
    return { ok: false as const, status: 403, error: "Forbidden", ip }
  }

  const header = request.headers.get("authorization") ?? ""
  const m = header.match(/^Bearer\s+(.+)$/i)
  const provided = m?.[1]?.trim() ?? null

  if (!tokenAllowed(provided)) {
    const configured = configuredTokens().length > 0
    logEvent(
      {
        event: "scim.auth",
        source: "scim",
        outcome: "deny",
        ip,
        detail: configured ? "token_invalid" : "token_not_configured"
      },
      "warn"
    )
    return { ok: false as const, status: 401, error: "Unauthorized", ip }
  }

  return { ok: true as const, ip }
}
