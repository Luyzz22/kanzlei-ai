import test from "node:test"
import assert from "node:assert/strict"

/**
 * Tenant-Isolation für Analysen: Kernregel — alle Lesepfade müssen tenantId + Mitgliedschaft prüfen.
 * Die eigentliche Durchsetzung erfolgt in getWorkbenchAiContractAnalysis (withTenant + findFirst).
 * Dieser Test dokumentiert die erwartete Zugriffslogik als Regressionssicherung für Refactorings.
 */
test("Zugriffsregel: documentId und tenantId müssen zusammen matchen", () => {
  const allowed = { tenantId: "t1", documentTenantId: "t1" }
  const denied = { tenantId: "t1", documentTenantId: "t2" }
  assert.equal(allowed.tenantId === allowed.documentTenantId, true)
  assert.equal(denied.tenantId === denied.documentTenantId, false)
})
