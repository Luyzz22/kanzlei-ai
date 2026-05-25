import test from "node:test"
import assert from "node:assert/strict"

import { sanitizeDiagnosticOutput, isProduction } from "../diagnostic-utils"

// --- sanitizeDiagnosticOutput ---

test("sanitizeDiagnosticOutput: passes through safe values untouched", () => {
  const input = { model: "claude-sonnet-4-6", durationMs: 1200, ok: true }
  const result = sanitizeDiagnosticOutput(input)
  assert.deepEqual(result, input)
})

test("sanitizeDiagnosticOutput: redacts keys matching 'secret'", () => {
  const input = { someSecret: "my-secret-value", normal: "visible" }
  const result = sanitizeDiagnosticOutput(input)
  assert.equal(result.someSecret, "[REDACTED]")
  assert.equal(result.normal, "visible")
})

test("sanitizeDiagnosticOutput: redacts keys matching 'token'", () => {
  const input = { accessToken: "eyJhbGciOi...", ok: true }
  const result = sanitizeDiagnosticOutput(input)
  assert.equal(result.accessToken, "[REDACTED]")
  assert.equal(result.ok, true)
})

test("sanitizeDiagnosticOutput: redacts keys matching 'apikey'", () => {
  const input = { apiKey: "sk-ant-api03-xxxx", environment: "staging" }
  const result = sanitizeDiagnosticOutput(input)
  assert.equal(result.apiKey, "[REDACTED]")
  assert.equal(result.environment, "staging")
})

test("sanitizeDiagnosticOutput: redacts keys matching 'password'", () => {
  const input = { password: "KanzleiAI2026!", name: "Admin" }
  const result = sanitizeDiagnosticOutput(input)
  assert.equal(result.password, "[REDACTED]")
  assert.equal(result.name, "Admin")
})

test("sanitizeDiagnosticOutput: redacts string values matching Anthropic key pattern", () => {
  const input = { status: "sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXXXX" }
  const result = sanitizeDiagnosticOutput(input)
  assert.equal(result.status, "[REDACTED]")
})

test("sanitizeDiagnosticOutput: redacts string values containing NEXTAUTH", () => {
  const input = { url: "NEXTAUTH_URL=https://www.kanzlei-ai.com" }
  const result = sanitizeDiagnosticOutput(input)
  assert.equal(result.url, "[REDACTED]")
})

test("sanitizeDiagnosticOutput: redacts string values containing DATABASE_URL", () => {
  const input = { debug: "DATABASE_URL=postgresql://user:pass@host/db" }
  const result = sanitizeDiagnosticOutput(input)
  assert.equal(result.debug, "[REDACTED]")
})

test("sanitizeDiagnosticOutput: handles null and undefined safely", () => {
  assert.equal(sanitizeDiagnosticOutput(null), null)
  assert.equal(sanitizeDiagnosticOutput(undefined), undefined)
})

test("sanitizeDiagnosticOutput: handles nested objects recursively", () => {
  const input = {
    outer: {
      inner: {
        apiKey: "sk-ant-xxxx",
        safe: "value"
      }
    }
  }
  const result = sanitizeDiagnosticOutput(input)
  assert.equal(result.outer.inner.apiKey, "[REDACTED]")
  assert.equal(result.outer.inner.safe, "value")
})

test("sanitizeDiagnosticOutput: handles arrays recursively", () => {
  const input = [
    { model: "claude", apiKey: "sk-ant-xxxx" },
    { model: "gpt4", ok: true }
  ]
  const result = sanitizeDiagnosticOutput(input)
  assert.equal(result[0].apiKey, "[REDACTED]")
  assert.equal(result[0].model, "claude")
  assert.equal(result[1].ok, true)
})

test("sanitizeDiagnosticOutput: passes through numbers and booleans", () => {
  const input = { count: 42, active: false, rate: 0.95 }
  const result = sanitizeDiagnosticOutput(input)
  assert.deepEqual(result, input)
})

test("sanitizeDiagnosticOutput: safe diagnostic payload passes through intact", () => {
  const input = {
    ok: true,
    environment: "development",
    timestamp: "2026-05-25T10:00:00.000Z",
    auth: {
      nextauthConfigured: true,
      googleConfigured: false,
    }
  }
  const result = sanitizeDiagnosticOutput(input)
  // 'nextauthConfigured' is a key name containing "nextauth" — not a secret key pattern
  // (the key-pattern matching uses 'secret', 'token', 'apikey', 'api_key', 'password', 'credential')
  assert.equal(result.ok, true)
  assert.equal(result.environment, "development")
})

// --- isProduction ---

test("isProduction: returns false in test environment", () => {
  // NODE_ENV is 'test' when running via tsx --test
  // VERCEL_ENV is not set in test
  const originalVercelEnv = process.env.VERCEL_ENV
  delete process.env.VERCEL_ENV
  // NODE_ENV is 'test' here, not 'production'
  assert.equal(isProduction(), false)
  if (originalVercelEnv !== undefined) process.env.VERCEL_ENV = originalVercelEnv
})

test("isProduction: returns true when VERCEL_ENV=production", () => {
  const original = process.env.VERCEL_ENV
  process.env.VERCEL_ENV = "production"
  assert.equal(isProduction(), true)
  if (original !== undefined) {
    process.env.VERCEL_ENV = original
  } else {
    delete process.env.VERCEL_ENV
  }
})
