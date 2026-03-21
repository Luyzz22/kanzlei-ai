"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import { updateTenantSecuritySettings } from "@/lib/tenant-settings/security-retention-settings-core"

export type SecurityAccessFormState = {
  status: "idle" | "success" | "error"
  message?: string
  fieldErrors?: Partial<
    Record<"adminSessionTimeoutMinutes" | "standardSessionTimeoutMinutes", string>
  >
}

const schema = z
  .object({
    adminSessionTimeoutMinutes: z.coerce
      .number({ invalid_type_error: "Bitte ein gültiges Zeitlimit in Minuten angeben." })
      .int("Bitte eine ganze Zahl in Minuten angeben.")
      .min(5, "Das Admin-Session-Limit muss mindestens 5 Minuten betragen.")
      .max(240, "Das Admin-Session-Limit darf maximal 240 Minuten betragen."),
    standardSessionTimeoutMinutes: z.coerce
      .number({ invalid_type_error: "Bitte ein gültiges Zeitlimit in Minuten angeben." })
      .int("Bitte eine ganze Zahl in Minuten angeben.")
      .min(15, "Das Standard-Session-Limit muss mindestens 15 Minuten betragen.")
      .max(1440, "Das Standard-Session-Limit darf maximal 1440 Minuten betragen."),
    requireMfaForPrivilegedRoles: z.enum(["true", "false"]),
    requireApprovalForPrivilegedRoleChanges: z.enum(["true", "false"]),
    requireReasonForPrivilegedReviewActions: z.enum(["true", "false"])
  })
  .refine((values) => values.adminSessionTimeoutMinutes <= values.standardSessionTimeoutMinutes, {
    path: ["adminSessionTimeoutMinutes"],
    message: "Das Admin-Session-Limit darf nicht über dem Standard-Session-Limit liegen."
  })

export async function updateSecurityAccessAction(
  _: SecurityAccessFormState,
  formData: FormData
): Promise<SecurityAccessFormState> {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      status: "error",
      message: "Bitte melden Sie sich an, um Einstellungen zu speichern."
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
    adminSessionTimeoutMinutes: formData.get("adminSessionTimeoutMinutes"),
    standardSessionTimeoutMinutes: formData.get("standardSessionTimeoutMinutes"),
    requireMfaForPrivilegedRoles: formData.get("requireMfaForPrivilegedRoles"),
    requireApprovalForPrivilegedRoleChanges: formData.get("requireApprovalForPrivilegedRoleChanges"),
    requireReasonForPrivilegedReviewActions: formData.get("requireReasonForPrivilegedReviewActions")
  })

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors

    return {
      status: "error",
      message: "Bitte prüfen Sie die markierten Eingaben.",
      fieldErrors: {
        adminSessionTimeoutMinutes: fieldErrors.adminSessionTimeoutMinutes?.[0],
        standardSessionTimeoutMinutes: fieldErrors.standardSessionTimeoutMinutes?.[0]
      }
    }
  }

  const saveResult = await updateTenantSecuritySettings({
    tenantId: tenantContext.tenantId,
    actorId: session.user.id,
    values: {
      adminSessionTimeoutMinutes: parsed.data.adminSessionTimeoutMinutes,
      standardSessionTimeoutMinutes: parsed.data.standardSessionTimeoutMinutes,
      requireMfaForPrivilegedRoles: parsed.data.requireMfaForPrivilegedRoles === "true",
      requireApprovalForPrivilegedRoleChanges: parsed.data.requireApprovalForPrivilegedRoleChanges === "true",
      requireReasonForPrivilegedReviewActions: parsed.data.requireReasonForPrivilegedReviewActions === "true"
    }
  })

  if (!saveResult.ok) {
    return {
      status: "error",
      message:
        saveResult.code === "FORBIDDEN"
          ? "Diese Einstellungen sind nur für Tenant-Administratoren verfügbar."
          : "Für dieses Konto liegt keine gültige Tenant-Mitgliedschaft vor."
    }
  }

  revalidatePath("/dashboard/admin/security-access")
  revalidatePath("/dashboard/admin/policies")

  return {
    status: "success",
    message:
      "Die Werte wurden gespeichert. Technische Durchsetzung und weitergehende Policy-Logik werden schrittweise ausgebaut."
  }
}
