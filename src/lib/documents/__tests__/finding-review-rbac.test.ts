import test from "node:test"
import assert from "node:assert/strict"

import { Role, TenantRole } from "@prisma/client"

import { canReviewContractAnalysisFindings } from "@/lib/documents/analysis-finding-review-policy"

test("Assistent/Member ohne Sonderrolle darf keine KI-Finding-Reviews", () => {
  assert.equal(canReviewContractAnalysisFindings(Role.ASSISTENT, TenantRole.MEMBER), false)
})

test("Anwalt darf Finding-Reviews", () => {
  assert.equal(canReviewContractAnalysisFindings(Role.ANWALT, TenantRole.MEMBER), true)
})

test("Tenant-Admin/Owner darf Finding-Reviews", () => {
  assert.equal(canReviewContractAnalysisFindings(Role.ASSISTENT, TenantRole.ADMIN), true)
  assert.equal(canReviewContractAnalysisFindings(Role.ASSISTENT, TenantRole.OWNER), true)
})

test("Plattform-Admin darf Finding-Reviews", () => {
  assert.equal(canReviewContractAnalysisFindings(Role.ADMIN, TenantRole.MEMBER), true)
})
