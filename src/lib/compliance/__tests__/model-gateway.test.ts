import test from "node:test"
import assert from "node:assert/strict"

import { authorizeAiRequest, PolicyViolationError } from "@/lib/compliance/model-gateway"
import { ModelType } from "@/types/ai"

const ENV_KEYS = [
  "ANTHROPIC_API_KEY",
  "AI_BEDROCK_ENABLED",
  "LLAMA_API_KEY",
  "LLAMA_API_BASE",
  "AI_ALLOW_THIRD_COUNTRY_LLM_TRANSFER",
  "AI_POLICY_ENFORCE"
] as const

async function withEnv(
  env: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>,
  run: () => Promise<void>
) {
  const previous: Record<string, string | undefined> = {}
  for (const key of ENV_KEYS) previous[key] = process.env[key]
  for (const key of ENV_KEYS) delete process.env[key]
  for (const [key, value] of Object.entries(env)) {
    if (value !== undefined) process.env[key] = value
  }
  try {
    await run()
  } finally {
    for (const key of ENV_KEYS) {
      if (previous[key] === undefined) delete process.env[key]
      else process.env[key] = previous[key]
    }
  }
}

const baseInput = {
  tenantId: "t1",
  actorId: "u1",
  useCase: "test"
}

test("Klasse 4 geht NIE ersatzweise extern, wenn lokal fehlt", async () => {
  await withEnv({ ANTHROPIC_API_KEY: "sk-ant-x" }, async () => {
    await assert.rejects(
      () => authorizeAiRequest({ ...baseInput, classification: 4 }),
      PolicyViolationError,
      "Klasse 4 muss scheitern statt nach aussen zu wandern"
    )
  })
})

test("Klasse 4 ist auch mit AI_POLICY_ENFORCE=false unbedingt", async () => {
  // Der Beobachtungsmodus lockert Klasse 0-3 — Klasse 4 niemals.
  await withEnv(
    { ANTHROPIC_API_KEY: "sk-ant-x", AI_POLICY_ENFORCE: "false" },
    async () => {
      await assert.rejects(
        () => authorizeAiRequest({ ...baseInput, classification: 4 }),
        PolicyViolationError
      )
    }
  )
})

test("Klasse 4 nutzt das lokale Modell, wenn vorhanden", async () => {
  await withEnv(
    {
      ANTHROPIC_API_KEY: "sk-ant-x",
      LLAMA_API_KEY: "k",
      LLAMA_API_BASE: "https://local.invalid"
    },
    async () => {
      const r = await authorizeAiRequest({ ...baseInput, classification: 4 })
      assert.equal(r.modelType, ModelType.LLAMA_COMPAT)
      assert.equal(r.decision.hardDeny, true)
      assert.equal(r.observedOnly, false)
    }
  )
})

test("Klasse 0 ohne Anbieterfreigabe laeuft nur beobachtet extern", async () => {
  // Seit der Provider-Governance setzt JEDER externe Weg ein geprueftes,
  // nicht abgelaufenes Profil voraus. In der Testumgebung existiert keines,
  // also lautet die Entscheidung LOCAL — mangels lokalem Modell laeuft der
  // Aufruf im Beobachtungsmodus trotzdem extern, aber sichtbar markiert.
  await withEnv({ ANTHROPIC_API_KEY: "sk-ant-x" }, async () => {
    const r = await authorizeAiRequest({ ...baseInput, classification: 0 })
    assert.equal(r.modelType, ModelType.CLAUDE_SONNET_4)
    assert.equal(r.decision.action, "LOCAL")
    assert.equal(r.decision.reason, "PROVIDER_PROFILE_MISSING")
    assert.equal(r.observedOnly, true)
  })
})

test("Klasse 3 ohne Opt-in geht lokal, wenn lokal verfügbar", async () => {
  await withEnv(
    {
      ANTHROPIC_API_KEY: "sk-ant-x",
      LLAMA_API_KEY: "k",
      LLAMA_API_BASE: "https://local.invalid"
    },
    async () => {
      const r = await authorizeAiRequest({ ...baseInput, classification: 3 })
      assert.equal(r.modelType, ModelType.LLAMA_COMPAT)
      assert.equal(r.decision.reason, "TENANT_POLICY_LOCAL_ONLY")
      assert.equal(r.observedOnly, false)
    }
  )
})

test("Klasse 3 ohne lokales Modell: Beobachtungsmodus läuft extern weiter, aber markiert", async () => {
  await withEnv({ ANTHROPIC_API_KEY: "sk-ant-x" }, async () => {
    const r = await authorizeAiRequest({ ...baseInput, classification: 3 })
    assert.equal(r.modelType, ModelType.CLAUDE_SONNET_4)
    assert.equal(r.observedOnly, true, "muss als nur beobachtet markiert sein")
    assert.equal(r.decision.action, "LOCAL", "die Entscheidung selbst bleibt LOCAL")
  })
})

test("AI_POLICY_ENFORCE=true blockiert genau diesen Fall", async () => {
  await withEnv(
    { ANTHROPIC_API_KEY: "sk-ant-x", AI_POLICY_ENFORCE: "true" },
    async () => {
      await assert.rejects(
        () => authorizeAiRequest({ ...baseInput, classification: 3 }),
        PolicyViolationError
      )
    }
  )
})

test("ohne jeden konfigurierten Anbieter wird blockiert", async () => {
  await withEnv({}, async () => {
    await assert.rejects(
      () => authorizeAiRequest({ ...baseInput, classification: 0 }),
      PolicyViolationError
    )
  })
})

test("Bedrock zählt als konfigurierter externer Anbieter", async () => {
  await withEnv({ AI_BEDROCK_ENABLED: "true" }, async () => {
    const r = await authorizeAiRequest({ ...baseInput, classification: 0 })
    assert.equal(r.modelType, ModelType.CLAUDE_SONNET_4)
  })
})

test("AI_POLICY_ENFORCE=true blockiert ohne Anbieterfreigabe", async () => {
  // Der eigentliche Zweck der Provider-Governance: im Durchsetzungsmodus
  // faellt der externe Weg weg, solange keine dokumentierte Freigabe existiert.
  await withEnv(
    { ANTHROPIC_API_KEY: "sk-ant-x", AI_POLICY_ENFORCE: "true" },
    async () => {
      await assert.rejects(
        () => authorizeAiRequest({ ...baseInput, classification: 0 }),
        PolicyViolationError
      )
    }
  )
})
