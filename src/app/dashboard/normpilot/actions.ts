"use server"

import { NormPilotReviewState } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import { upsertNormPilotCorrectiveAction } from "@/lib/normpilot/action-core"
import { createNormPilotEvidenceSource } from "@/lib/normpilot/evidence-core"
import { generateNormPilotEvidencePackExport } from "@/lib/normpilot/export-core"
import { upsertNormPilotGap } from "@/lib/normpilot/gap-core"
import { upsertNormPilotEvidenceMapping } from "@/lib/normpilot/matrix-core"
import {
  createNormPilotRequirementItem,
  createNormPilotRequirementSet,
  importNormPilotRequirementSetJson,
  type NormPilotRequirementImportInput
} from "@/lib/normpilot/requirement-core"
import {
  transitionNormPilotReviewState,
  type NormPilotReviewResourceType
} from "@/lib/normpilot/review-core"
import { runAndPersistNormPilotMockSprint } from "@/lib/normpilot/sprint-core"

async function requireActionContext() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Nicht autorisiert")

  const tenantContext = await resolveTenantContextForUser(session.user.id)
  if (tenantContext.status !== "single") throw new Error("Kein eindeutiger Mandantenkontext")

  return { actorId: session.user.id, tenantId: tenantContext.tenantId }
}

function optionalText(value: FormDataEntryValue | null): string | undefined {
  const text = typeof value === "string" ? value.trim() : ""
  return text.length > 0 ? text : undefined
}

const createSetSchema = z.object({
  title: z.string().min(1).max(240),
  frameworkLabel: z.string().max(120).optional(),
  scopeLabel: z.string().max(200).optional(),
  versionLabel: z.string().max(80).optional()
})

export async function createNormPilotRequirementSetAction(formData: FormData) {
  const ctx = await requireActionContext()
  const parsed = createSetSchema.parse({
    title: optionalText(formData.get("title")),
    frameworkLabel: optionalText(formData.get("frameworkLabel")),
    scopeLabel: optionalText(formData.get("scopeLabel")),
    versionLabel: optionalText(formData.get("versionLabel"))
  })

  const result = await createNormPilotRequirementSet({ ...ctx, values: parsed })
  if (!result.ok) throw new Error("Requirement Set konnte nicht erstellt werden.")
  revalidatePath("/dashboard/normpilot")
  redirect(`/dashboard/normpilot/${result.data.id}`)
}

export async function importNormPilotRequirementSetJsonAction(formData: FormData) {
  const ctx = await requireActionContext()
  const raw = optionalText(formData.get("payload"))
  if (!raw) throw new Error("JSON-Import ist leer.")

  const result = await importNormPilotRequirementSetJson({
    ...ctx,
    payload: JSON.parse(raw) as NormPilotRequirementImportInput
  })
  if (!result.ok) throw new Error("Requirement-Import konnte nicht gespeichert werden.")
  revalidatePath("/dashboard/normpilot")
  redirect(`/dashboard/normpilot/${result.data.requirementSetId}`)
}

const requirementItemSchema = z.object({
  requirementSetId: z.string().min(1),
  code: z.string().min(1).max(80),
  title: z.string().min(1).max(240),
  customerText: z.string().max(4000).optional(),
  normReferenceCode: z.string().max(120).optional(),
  criticality: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional()
})

export async function createNormPilotRequirementItemAction(formData: FormData) {
  const ctx = await requireActionContext()
  const parsed = requirementItemSchema.parse({
    requirementSetId: optionalText(formData.get("requirementSetId")),
    code: optionalText(formData.get("code")),
    title: optionalText(formData.get("title")),
    customerText: optionalText(formData.get("customerText")),
    normReferenceCode: optionalText(formData.get("normReferenceCode")),
    criticality: optionalText(formData.get("criticality"))
  })

  const result = await createNormPilotRequirementItem({ ...ctx, values: parsed })
  if (!result.ok) throw new Error("Requirement Item konnte nicht gespeichert werden.")
  revalidatePath(`/dashboard/normpilot/${parsed.requirementSetId}`)
}

const evidenceSourceSchema = z.object({
  sourceType: z.string().min(1).max(80),
  title: z.string().min(1).max(240),
  documentId: z.string().max(120).optional()
})

export async function createNormPilotEvidenceSourceAction(formData: FormData) {
  const ctx = await requireActionContext()
  const requirementSetId = optionalText(formData.get("requirementSetId"))
  const parsed = evidenceSourceSchema.parse({
    sourceType: optionalText(formData.get("sourceType")),
    title: optionalText(formData.get("title")),
    documentId: optionalText(formData.get("documentId"))
  })

  const result = await createNormPilotEvidenceSource({ ...ctx, values: parsed })
  if (!result.ok) throw new Error("Evidence Source konnte nicht gespeichert werden.")
  if (requirementSetId) revalidatePath(`/dashboard/normpilot/${requirementSetId}`)
}

export async function runNormPilotMockSprintAction(formData: FormData) {
  const ctx = await requireActionContext()
  const requirementSetId = String(formData.get("requirementSetId") ?? "")
  const result = await runAndPersistNormPilotMockSprint({ ...ctx, requirementSetId })
  if (!result.ok) throw new Error("Mock Sprint konnte nicht gespeichert werden.")
  revalidatePath(`/dashboard/normpilot/${requirementSetId}`)
}

const reviewSchema = z.object({
  resourceType: z.enum(["requirement_set", "evidence_mapping", "gap_finding", "corrective_action"]),
  resourceId: z.string().min(1),
  requirementSetId: z.string().min(1),
  nextState: z.nativeEnum(NormPilotReviewState)
})

export async function transitionNormPilotReviewStateAction(formData: FormData) {
  const ctx = await requireActionContext()
  const parsed = reviewSchema.parse({
    resourceType: optionalText(formData.get("resourceType")),
    resourceId: optionalText(formData.get("resourceId")),
    requirementSetId: optionalText(formData.get("requirementSetId")),
    nextState: optionalText(formData.get("nextState"))
  })

  const result = await transitionNormPilotReviewState({
    ...ctx,
    resourceType: parsed.resourceType as NormPilotReviewResourceType,
    resourceId: parsed.resourceId,
    nextState: parsed.nextState
  })
  if (!result.ok) throw new Error("Review-State konnte nicht aktualisiert werden.")
  revalidatePath(`/dashboard/normpilot/${parsed.requirementSetId}`)
}

export async function createNormPilotEvidencePackExportAction(formData: FormData) {
  const ctx = await requireActionContext()
  const requirementSetId = String(formData.get("requirementSetId") ?? "")
  const format = String(formData.get("format") ?? "MARKDOWN") === "CSV" ? "CSV" : "MARKDOWN"
  const result = await generateNormPilotEvidencePackExport({ ...ctx, requirementSetId, format })
  if (!result.ok) throw new Error("Evidence Pack Export konnte nicht erzeugt werden.")
  revalidatePath(`/dashboard/normpilot/${requirementSetId}`)
}

const mappingSchema = z.object({
  requirementItemId: z.string().min(1),
  evidenceSourceId: z.string().min(1).optional(),
  requirementSetId: z.string().min(1),
  status: z.enum(["COVERED", "PARTIAL", "MISSING", "CONFLICTING", "NOT_APPLICABLE", "NEEDS_REVIEW"])
})

export async function createNormPilotEvidenceMappingAction(formData: FormData) {
  const ctx = await requireActionContext()
  const parsed = mappingSchema.parse({
    requirementItemId: optionalText(formData.get("requirementItemId")),
    evidenceSourceId: optionalText(formData.get("evidenceSourceId")),
    requirementSetId: optionalText(formData.get("requirementSetId")),
    status: optionalText(formData.get("status")) ?? "NEEDS_REVIEW"
  })
  const result = await upsertNormPilotEvidenceMapping({
    ...ctx,
    values: {
      requirementItemId: parsed.requirementItemId,
      evidenceSourceId: parsed.evidenceSourceId,
      status: parsed.status
    }
  })
  if (!result.ok) throw new Error("Evidence Mapping konnte nicht gespeichert werden.")
  revalidatePath(`/dashboard/normpilot/${parsed.requirementSetId}`)
}

const gapSchema = z.object({
  requirementSetId: z.string().min(1),
  requirementItemId: z.string().min(1).optional(),
  title: z.string().min(1).max(240),
  description: z.string().min(1).max(8000),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"])
})

export async function createNormPilotGapAction(formData: FormData) {
  const ctx = await requireActionContext()
  const parsed = gapSchema.parse({
    requirementSetId: optionalText(formData.get("requirementSetId")),
    requirementItemId: optionalText(formData.get("requirementItemId")),
    title: optionalText(formData.get("title")),
    description: optionalText(formData.get("description")),
    severity: optionalText(formData.get("severity")) ?? "MEDIUM"
  })
  const result = await upsertNormPilotGap({ ...ctx, values: parsed })
  if (!result.ok) throw new Error("Gap konnte nicht gespeichert werden.")
  revalidatePath(`/dashboard/normpilot/${parsed.requirementSetId}`)
}

const actionSchema = z.object({
  requirementSetId: z.string().min(1),
  requirementItemId: z.string().min(1).optional(),
  gapFindingId: z.string().min(1).optional(),
  title: z.string().min(1).max(240),
  ownerRole: z.string().max(120).optional(),
  acceptanceCriteria: z.string().max(4000).optional()
})

export async function createNormPilotCorrectiveActionAction(formData: FormData) {
  const ctx = await requireActionContext()
  const parsed = actionSchema.parse({
    requirementSetId: optionalText(formData.get("requirementSetId")),
    requirementItemId: optionalText(formData.get("requirementItemId")),
    gapFindingId: optionalText(formData.get("gapFindingId")),
    title: optionalText(formData.get("title")),
    ownerRole: optionalText(formData.get("ownerRole")),
    acceptanceCriteria: optionalText(formData.get("acceptanceCriteria"))
  })
  const result = await upsertNormPilotCorrectiveAction({
    ...ctx,
    values: {
      requirementItemId: parsed.requirementItemId,
      gapFindingId: parsed.gapFindingId,
      title: parsed.title,
      ownerRole: parsed.ownerRole,
      acceptanceCriteria: parsed.acceptanceCriteria
    }
  })
  if (!result.ok) throw new Error("Corrective Action konnte nicht gespeichert werden.")
  revalidatePath(`/dashboard/normpilot/${parsed.requirementSetId}`)
}
