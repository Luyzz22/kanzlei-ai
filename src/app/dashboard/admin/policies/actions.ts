"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import { saveTenantGovernanceSettings } from "@/lib/tenant-settings/governance-settings-core"

export type GovernanceSettingsFormState = {
  status: "idle" | "success" | "error"
  message?: string
  fieldErrors?: Partial<Record<"sessionTimeoutMinutes" | "documentRetentionDays", string>>
}

const schema = z.object({
  sessionTimeoutMinutes: z.coerce
    .number({ invalid_type_error: "Bitte eine gültige Sitzungsdauer angeben." })
    .int("Bitte eine ganze Zahl in Minuten angeben.")
    .min(5, "Die Sitzungsdauer muss mindestens 5 Minuten betragen.")
    .max(1440, "Die Sitzungsdauer darf maximal 1440 Minuten betragen."),
  requireMfaForPrivilegedRoles: z.enum(["true", "false"]),
  documentRetentionDays: z.coerce
    .number({ invalid_type_error: "Bitte eine gültige Aufbewahrungsdauer angeben." })
    .int("Bitte eine ganze Zahl in Tagen angeben.")
    .min(30, "Die Aufbewahrung muss mindestens 30 Tage betragen.")
    .max(3650, "Die Aufbewahrung darf maximal 3650 Tage betragen."),
  autoArchiveApprovedDocuments: z.enum(["true", "false"])
})

export async function updateGovernanceSettingsAction(
  _: GovernanceSettingsFormState,
  formData: FormData
): Promise<GovernanceSettingsFormState> {
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
      message: "Für Ihr Konto ist kein Mandantenkontext hinterlegt."
    }
  }

  if (tenantContext.status === "multiple") {
    return {
      status: "error",
      message: "Für diesen Bereich ist ein eindeutiger Mandantenkontext erforderlich."
    }
  }

  const parsed = schema.safeParse({
    sessionTimeoutMinutes: formData.get("sessionTimeoutMinutes"),
    requireMfaForPrivilegedRoles: formData.get("requireMfaForPrivilegedRoles"),
    documentRetentionDays: formData.get("documentRetentionDays"),
    autoArchiveApprovedDocuments: formData.get("autoArchiveApprovedDocuments")
  })

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors

    return {
      status: "error",
      message: "Bitte prüfen Sie die Eingaben und korrigieren Sie die markierten Felder.",
      fieldErrors: {
        sessionTimeoutMinutes: fieldErrors.sessionTimeoutMinutes?.[0],
        documentRetentionDays: fieldErrors.documentRetentionDays?.[0]
      }
    }
  }

  const saveResult = await saveTenantGovernanceSettings({
    tenantId: tenantContext.tenantId,
    actorId: session.user.id,
    values: {
      sessionTimeoutMinutes: parsed.data.sessionTimeoutMinutes,
      requireMfaForPrivilegedRoles: parsed.data.requireMfaForPrivilegedRoles === "true",
      documentRetentionDays: parsed.data.documentRetentionDays,
      autoArchiveApprovedDocuments: parsed.data.autoArchiveApprovedDocuments === "true"
    }
  })

  if (!saveResult.ok) {
    return {
      status: "error",
      message:
        saveResult.code === "FORBIDDEN"
          ? "Änderungen sind nur für privilegierte Tenant-Administrationsrollen zulässig."
          : "Für Ihr Konto liegt keine gültige Tenant-Mitgliedschaft vor."
    }
  }

  revalidatePath("/dashboard/admin/policies")

  return {
    status: "success",
    message: "Einstellungen gespeichert. Änderungen werden revisionsnah protokolliert."
  }
}
