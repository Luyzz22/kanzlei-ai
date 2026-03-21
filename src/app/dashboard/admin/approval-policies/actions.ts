"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import { updateTenantApprovalPolicy } from "@/lib/tenant-settings/approval-policy-core"

export type ApprovalPoliciesFormState = {
  status: "idle" | "success" | "error"
  message?: string
}

const schema = z.object({
  requireFourEyesForApproval: z.enum(["true", "false"]),
  requireReasonForApproval: z.enum(["true", "false"]),
  requireReasonForArchiving: z.enum(["true", "false"]),
  approvalRestrictedToPrivilegedRoles: z.enum(["true", "false"]),
  archivingRestrictedToPrivilegedRoles: z.enum(["true", "false"]),
  reviewStartRestrictedToPrivilegedRoles: z.enum(["true", "false"])
})

export async function updateApprovalPoliciesAction(
  _: ApprovalPoliciesFormState,
  formData: FormData
): Promise<ApprovalPoliciesFormState> {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      status: "error",
      message: "Bitte melden Sie sich an, um Freigaberichtlinien zu speichern."
    }
  }

  const tenantContext = await resolveTenantContextForUser(session.user.id)

  if (tenantContext.status === "none") {
    return {
      status: "error",
      message: "Für dieses Konto ist aktuell kein eindeutiger Mandantenkontext hinterlegt."
    }
  }

  if (tenantContext.status === "multiple") {
    return {
      status: "error",
      message: "Für diesen Bereich ist ein eindeutiger Mandantenkontext erforderlich."
    }
  }

  const parsed = schema.safeParse({
    requireFourEyesForApproval: formData.get("requireFourEyesForApproval"),
    requireReasonForApproval: formData.get("requireReasonForApproval"),
    requireReasonForArchiving: formData.get("requireReasonForArchiving"),
    approvalRestrictedToPrivilegedRoles: formData.get("approvalRestrictedToPrivilegedRoles"),
    archivingRestrictedToPrivilegedRoles: formData.get("archivingRestrictedToPrivilegedRoles"),
    reviewStartRestrictedToPrivilegedRoles: formData.get("reviewStartRestrictedToPrivilegedRoles")
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: "Bitte prüfen Sie die Eingaben."
    }
  }

  const saveResult = await updateTenantApprovalPolicy({
    tenantId: tenantContext.tenantId,
    actorId: session.user.id,
    values: {
      requireFourEyesForApproval: parsed.data.requireFourEyesForApproval === "true",
      requireReasonForApproval: parsed.data.requireReasonForApproval === "true",
      requireReasonForArchiving: parsed.data.requireReasonForArchiving === "true",
      approvalRestrictedToPrivilegedRoles: parsed.data.approvalRestrictedToPrivilegedRoles === "true",
      archivingRestrictedToPrivilegedRoles: parsed.data.archivingRestrictedToPrivilegedRoles === "true",
      reviewStartRestrictedToPrivilegedRoles: parsed.data.reviewStartRestrictedToPrivilegedRoles === "true"
    }
  })

  if (!saveResult.ok) {
    return {
      status: "error",
      message:
        saveResult.code === "FORBIDDEN"
          ? "Diese Richtlinien sind nur für Tenant-Administratoren verfügbar."
          : "Für dieses Konto liegt keine gültige Tenant-Mitgliedschaft vor."
    }
  }

  revalidatePath("/dashboard/admin/approval-policies")
  revalidatePath("/dashboard/admin/policies")
  revalidatePath("/workspace/review-queue")

  return {
    status: "success",
    message: "Die Änderungen wurden gespeichert und gelten für nachfolgende Review-Schritte."
  }
}
