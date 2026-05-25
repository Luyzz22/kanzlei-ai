#!/usr/bin/env node
/**
 * Security Smoke Test — Anonymous Endpoint Hardening
 *
 * Tests all admin/debug API routes for unauthenticated access.
 * All must return 404, 401, 403, or 405 — never 200/201/204 or leak secrets.
 *
 * Usage:
 *   node scripts/security-smoke-test.mjs
 *   BASE_URL=https://staging.kanzlei-ai.com node scripts/security-smoke-test.mjs
 *
 * DSGVO Art. 32, NIS2 Art. 21, ISO 27001 A.8
 */

const BASE_URL = process.env.BASE_URL ?? "https://www.kanzlei-ai.com"

// Routes to test with their safe HTTP methods (no mutations)
const ROUTES = [
  { path: "/api/auth/debug",            method: "GET",  mutatingSafe: true },
  { path: "/api/admin/status",          method: "GET",  mutatingSafe: true },
  { path: "/api/admin/test-anthropic",  method: "GET",  mutatingSafe: true },
  { path: "/api/admin/diagnose-risk",   method: "GET",  mutatingSafe: true },
  { path: "/api/admin/eval-dashboard",  method: "GET",  mutatingSafe: true },
  { path: "/api/admin/eval-golden",     method: "GET",  mutatingSafe: true },
  // POST-only routes — use HEAD first; if 405, skip GET (mutating)
  { path: "/api/admin/seed",            method: "HEAD", mutatingSafe: false },
  { path: "/api/admin/provision-demo",  method: "HEAD", mutatingSafe: false },
]

// Status codes that are acceptable for unauthenticated access to admin routes
const ALLOWED_STATUSES = new Set([404, 401, 403, 405])

// Patterns that must not appear in any response body (case-insensitive where applicable)
const FORBIDDEN_BODY_PATTERNS = [
  /NEXTAUTH/,
  /DATABASE_URL/i,
  /DIRECT_URL/i,
  /ANTHROPIC_API_KEY/i,
  /OPENAI_API_KEY/i,
  /GEMINI_API_KEY/i,
  /STRIPE_SECRET/i,
  /WEBHOOK_SECRET/i,
  /sk-ant-[a-zA-Z0-9\-_]{10,}/,
  /sk-[a-zA-Z0-9]{20,}/,
]

// Keys in JSON responses that should not appear for unauthenticated callers
const FORBIDDEN_JSON_KEYS = [
  "apiKeyFingerprint",
  "databaseUrl",
  "directUrl",
  "nextauthUrl",
]

function red(s) { return `\x1b[31m${s}\x1b[0m` }
function green(s) { return `\x1b[32m${s}\x1b[0m` }
function yellow(s) { return `\x1b[33m${s}\x1b[0m` }
function bold(s) { return `\x1b[1m${s}\x1b[0m` }

async function testRoute(route) {
  const url = `${BASE_URL}${route.path}`
  const result = {
    path: route.path,
    method: route.method,
    status: null,
    passed: false,
    issues: [],
    note: null,
  }

  try {
    const res = await fetch(url, {
      method: route.method,
      headers: {
        "User-Agent": "KanzleiAI-SecuritySmokeTest/1.0",
        "Accept": "application/json",
      },
      redirect: "manual", // Don't follow redirects — catch 3xx explicitly
    })

    result.status = res.status

    // Check status code
    if (!ALLOWED_STATUSES.has(res.status)) {
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location") ?? ""
        // Redirects to /login are acceptable (auth redirect for browser flows)
        if (location.includes("/login")) {
          result.note = `Redirect → ${location} (auth gate, acceptable)`
          result.passed = true
          return result
        }
        result.issues.push(`Unexpected redirect (${res.status}) to: ${location}`)
      } else {
        result.issues.push(`Status ${res.status} not in allowed set [404, 401, 403, 405]`)
      }
    }

    // For HEAD requests: 405 means method not allowed → GET would be mutating
    if (route.method === "HEAD" && res.status === 405 && !route.mutatingSafe) {
      result.note = "HEAD → 405: route is POST-only; GET skipped (mutating). Manual review required."
      result.passed = true
      return result
    }

    // For HEAD requests that returned allowed status: no body to check
    if (route.method === "HEAD") {
      result.passed = result.issues.length === 0
      return result
    }

    // Check response body for secret leakage
    const bodyText = await res.text().catch(() => "")

    for (const pattern of FORBIDDEN_BODY_PATTERNS) {
      if (pattern.test(bodyText)) {
        result.issues.push(`Response body matches forbidden pattern: ${pattern}`)
      }
    }

    // Check JSON keys
    try {
      const json = JSON.parse(bodyText)
      for (const key of FORBIDDEN_JSON_KEYS) {
        if (key in json) {
          result.issues.push(`Response JSON contains forbidden key: "${key}"`)
        }
      }
    } catch {
      // Not JSON — that's fine for 404/401 HTML or plain text
    }

    result.passed = result.issues.length === 0
  } catch (err) {
    result.issues.push(`Network error: ${err.message}`)
    result.passed = false
  }

  return result
}

async function main() {
  console.log(bold(`\n🔒 KanzleiAI Security Smoke Test`))
  console.log(`   Target: ${BASE_URL}`)
  console.log(`   Date:   ${new Date().toISOString()}\n`)

  const results = []
  for (const route of ROUTES) {
    process.stdout.write(`  Testing ${route.method.padEnd(4)} ${route.path} ... `)
    const result = await testRoute(route)
    results.push(result)

    if (result.passed) {
      const statusStr = result.status ? `[${result.status}]` : "[no-status]"
      console.log(green(`✓ ${statusStr}`) + (result.note ? ` — ${result.note}` : ""))
    } else {
      console.log(red(`✗ [${result.status}]`))
      for (const issue of result.issues) {
        console.log(red(`     ⚠  ${issue}`))
      }
    }
  }

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  const manualReview = results.filter((r) => r.note?.includes("Manual review")).length

  console.log(`\n${bold("Summary")}`)
  console.log(`  ${green(`${passed} passed`)}  |  ${failed > 0 ? red(`${failed} failed`) : "0 failed"}  |  ${yellow(`${manualReview} manual review`)}`)

  if (manualReview > 0) {
    console.log(yellow(`\n  ⚠  Some POST-only routes could not be tested non-destructively.`))
    console.log(yellow(`     Perform manual authenticated testing for those routes.`))
  }

  if (failed > 0) {
    console.log(red(`\n  ✗ SMOKE TEST FAILED — admin/debug routes may be publicly accessible.`))
    console.log(red(`    Block deployment until all routes return 404/401/403/405.\n`))
    process.exit(1)
  } else {
    console.log(green(`\n  ✓ All tested routes are properly hardened.\n`))
    process.exit(0)
  }
}

main().catch((err) => {
  console.error(red(`\nFatal: ${err.message}`))
  process.exit(1)
})
