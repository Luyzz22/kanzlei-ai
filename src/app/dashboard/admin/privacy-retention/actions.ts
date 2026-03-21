"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import { updateTenantRetentionSettings } from "@/lib/tenant-settings/security-retention-settings-core"

export type PrivacyRetentionFormState = {
  status: "idle" | "success" | "error"
  message?: string
  fieldErrors?: Partial<
    Record<"defaultDocumentRetentionDays" | "auditEvidenceRetentionDays" | "reviewDueDays" | "archiveAfterApprovalDays", string>
  >
}

const schema = z
  .object({
    defaultDocumentRetentionDays: z.coerce
      .number({ invalid_type_error: "Bitte eine gültige Aufbewahrungsdauer angeben." })
      .int("Bitte eine ganze Zahl in Tagen angeben.")
      .min(30, "Die Standard-Aufbewahrung muss mindestens 30 Tage betragen.")
      .max(3650, "Die Standard-Aufbewahrung darf maximal 3650 Tage betragen."),
    auditEvidenceRetentionDays: z.coerce
      .number({ invalid_type_error: "Bitte eine gültige Aufbewahrungsdauer angeben." })
      .int("Bitte eine ganze Zahl in Tagen angeben.")
      .min(365, "Audit-nahe Nachweise müssen mindestens 365 Tage aufbewahrt werden.")
      .max(3650, "Audit-nahe Nachweise dürfen maximal 3650 Tage aufbewahrt werden."),
    reviewDueDays: z.coerce
      .number({ invalid_type_error: "Bitte eine gültige Review-Frist angeben." })
      .int("Bitte eine ganze Zahl in Tagen angeben.")
      .min(1, "Die Review-Frist muss mindestens 1 Tag betragen.")
      .max(180, "Die Review-Frist darf maximal 180 Tage betragen."),
    archiveAfterApprovalDays: z.coerce
      .number({ invalid_type_error: "Bitte ein gültiges Archivierungsfenster angeben." })
      .int("Bitte eine ganze Zahl in Tagen angeben.")
      .min(0, "Das Archivierungsfenster darf nicht negativ sein.")
      .max(365, "Das Archivierungsfenster darf maximal 365 Tage betragen."),
    softDeletePolicyEnabled: z.enum(["true", "false"])
  })
  .refine((values) => values.auditEvidenceRetentionDays >= values.defaultDocumentRetentionDays, {
    path: ["auditEvidenceRetentionDays"],
    message: "Audit-nahe Aufbewahrung darf nicht kürzer sein als die Standard-Aufbewahrung."
  })

export async function updatePrivacyRetentionAction(
  _: PrivacyRetentionFormState,
  formData: FormData
): Promise<PrivacyRetentionFormState> {
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
    defaultDocumentRetentionDays: formData.get("defaultDocumentRetentionDays"),
    auditEvidenceRetentionDays: formData.get("auditEvidenceRetentionDays"),
    reviewDueDays: formData.get("reviewDueDays"),
    archiveAfterApprovalDays: formData.get("archiveAfterApprovalDays"),
    softDeletePolicyEnabled: formData.get("softDeletePolicyEnabled")
  })

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors

    return {
      status: "error",
      message: "Bitte prüfen Sie die markierten Eingaben.",
      fieldErrors: {
        defaultDocumentRetentionDays: fieldErrors.defaultDocumentRetentionDays?.[0],
        auditEvidenceRetentionDays: fieldErrors.auditEvidenceRetentionDays?.[0],
        reviewDueDays: fieldErrors.reviewDueDays?.[0],
        archiveAfterApprovalDays: fieldErrors.archiveAfterApprovalDays?.[0]
      }
    }
  }

  const saveResult = await updateTenantRetentionSettings({
    tenantId: tenantContext.tenantId,
    actorId: session.user.id,
    values: {
      defaultDocumentRetentionDays: parsed.data.defaultDocumentRetentionDays,
      auditEvidenceRetentionDays: parsed.data.auditEvidenceRetentionDays,
      reviewDueDays: parsed.data.reviewDueDays,
      archiveAfterApprovalDays: parsed.data.archiveAfterApprovalDays,
      softDeletePolicyEnabled: parsed.data.softDeletePolicyEnabled === "true"
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

  revalidatePath("/dashboard/admin/privacy-retention")
  revalidatePath("/dashboard/admin/policies")

  return {
    status: "success",
    message:
      "Die Werte wurden gespeichert. Technische Durchsetzung und weitergehende Policy-Logik werden schrittweise ausgebaut."
  }
}
