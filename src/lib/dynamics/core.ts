import "server-only"

import { prisma } from "@/lib/prisma"
import { withTenant } from "@/lib/tenant-context-core"
import { writeAuditEvent } from "@/lib/audit-core"
import { encryptSecret, decryptSecret, secretFingerprint } from "@/lib/dynamics/crypto"

export type DynamicsConfigInput = {
  azureTenantId: string
  clientId: string
  clientSecret: string
  environment: string
  companyId?: string | null
  companyName?: string | null
  baseUrl?: string
}

export type DynamicsConfigPublic = {
  id: string
  azureTenantId: string
  clientId: string
  secretFingerprint: string
  environment: string
  companyId: string | null
  companyName: string | null
  baseUrl: string
  syncEnabled: boolean
  webhookEnabled: boolean
  lastSyncAt: Date | null
  lastSyncStatus: string | null
  lastSyncError: string | null
  createdAt: Date
  updatedAt: Date
  isConfigured: boolean
}

// ---------------------------------------------------------------
// Config: read (never returns the plaintext secret!)
// ---------------------------------------------------------------
export async function getDynamicsConfig(tenantId: string, actorId: string): Promise<DynamicsConfigPublic | null> {
  return withTenant(tenantId, async (tx) => {
    const row = await tx.dynamicsIntegration.findUnique({
      where: { tenantId }
    })
    if (!row) return null

    // Fingerprint ohne Klartext-Exposition
    let fingerprint = "—"
    try {
      const pt = decryptSecret(row.clientSecretEncrypted)
      fingerprint = secretFingerprint(pt)
    } catch {
      fingerprint = "⚠ decryption failed"
    }

    // Audit: Read ist bewusst auditiert — Admin-Zugriff auf Credentials-Metadata
    await writeAuditEvent({
      tenantId,
      actorId,
      action: "dynamics.config.read",
      resourceType: "dynamics_integration",
      resourceId: row.id,
      metadata: { azureTenantId: row.azureTenantId, clientId: row.clientId }
    })

    return {
      id: row.id,
      azureTenantId: row.azureTenantId,
      clientId: row.clientId,
      secretFingerprint: fingerprint,
      environment: row.environment,
      companyId: row.companyId,
      companyName: row.companyName,
      baseUrl: row.baseUrl,
      syncEnabled: row.syncEnabled,
      webhookEnabled: row.webhookEnabled,
      lastSyncAt: row.lastSyncAt,
      lastSyncStatus: row.lastSyncStatus,
      lastSyncError: row.lastSyncError,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      isConfigured: Boolean(row.azureTenantId && row.clientId && row.clientSecretEncrypted)
    }
  })
}

// ---------------------------------------------------------------
// Config: upsert
// ---------------------------------------------------------------
export async function upsertDynamicsConfig(
  tenantId: string,
  actorId: string,
  input: DynamicsConfigInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  // Validation: strenge Format-Pruefung auf UUIDs fuer Azure-IDs
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (!uuidPattern.test(input.azureTenantId)) {
    return { success: false, error: "Azure Tenant ID muss eine gueltige UUID sein" }
  }
  if (!uuidPattern.test(input.clientId)) {
    return { success: false, error: "Client ID muss eine gueltige UUID sein" }
  }
  if (!input.clientSecret || input.clientSecret.length < 10) {
    return { success: false, error: "Client Secret fehlt oder ist zu kurz" }
  }
  if (!["Production", "Sandbox"].includes(input.environment)) {
    return { success: false, error: "Environment muss Production oder Sandbox sein" }
  }

  const encryptedSecret = encryptSecret(input.clientSecret)

  return withTenant(tenantId, async (tx) => {
    const row = await tx.dynamicsIntegration.upsert({
      where: { tenantId },
      create: {
        tenantId,
        azureTenantId: input.azureTenantId,
        clientId: input.clientId,
        clientSecretEncrypted: encryptedSecret,
        environment: input.environment,
        companyId: input.companyId ?? null,
        companyName: input.companyName ?? null,
        baseUrl: input.baseUrl?.trim() || "https://api.businesscentral.dynamics.com/v2.0"
      },
      update: {
        azureTenantId: input.azureTenantId,
        clientId: input.clientId,
        clientSecretEncrypted: encryptedSecret,
        environment: input.environment,
        companyId: input.companyId ?? null,
        companyName: input.companyName ?? null,
        baseUrl: input.baseUrl?.trim() || "https://api.businesscentral.dynamics.com/v2.0"
      }
    })

    await writeAuditEvent({
      tenantId,
      actorId,
      action: "dynamics.config.upsert",
      resourceType: "dynamics_integration",
      resourceId: row.id,
      metadata: {
        azureTenantId: input.azureTenantId,
        clientId: input.clientId,
        environment: input.environment,
        companyId: input.companyId ?? null,
        secretFingerprint: secretFingerprint(input.clientSecret)
      }
    })

    return { success: true as const, id: row.id }
  })
}

// ---------------------------------------------------------------
// Config: delete
// ---------------------------------------------------------------
export async function deleteDynamicsConfig(
  tenantId: string,
  actorId: string
): Promise<{ success: boolean }> {
  return withTenant(tenantId, async (tx) => {
    const existing = await tx.dynamicsIntegration.findUnique({ where: { tenantId } })
    if (!existing) return { success: false }

    await tx.dynamicsIntegration.delete({ where: { tenantId } })

    await writeAuditEvent({
      tenantId,
      actorId,
      action: "dynamics.config.delete",
      resourceType: "dynamics_integration",
      resourceId: existing.id,
      metadata: { azureTenantId: existing.azureTenantId, clientId: existing.clientId }
    })

    return { success: true }
  })
}

// ---------------------------------------------------------------
// API Client (Token fetch + REST calls)
// ---------------------------------------------------------------

type BcCompany = {
  id: string
  name: string
  displayName?: string
  systemVersion?: string
}

type BcVendor = {
  id: string
  number: string
  displayName: string
  addressLine1?: string
  city?: string
  country?: string
  phoneNumber?: string
  email?: string
  balance?: number
  currencyCode?: string
  lastModifiedDateTime?: string
}

type BcPurchaseOrder = {
  id: string
  number: string
  orderDate?: string
  vendorId?: string
  vendorNumber?: string
  vendorName?: string
  status?: string
  totalAmountIncludingTax?: number
  currencyCode?: string
  lastModifiedDateTime?: string
}

type BcPurchaseInvoice = {
  id: string
  number: string
  invoiceDate?: string
  dueDate?: string
  vendorId?: string
  vendorNumber?: string
  vendorName?: string
  status?: string
  totalAmountIncludingTax?: number
  remainingAmount?: number
  currencyCode?: string
  lastModifiedDateTime?: string
}

export type DynamicsApiClient = {
  listCompanies(): Promise<BcCompany[]>
  listVendors(companyId: string): Promise<BcVendor[]>
  listPurchaseOrders(companyId: string): Promise<BcPurchaseOrder[]>
  listPurchaseInvoices(companyId: string): Promise<BcPurchaseInvoice[]>
}

async function getEntraToken(
  azureTenantId: string,
  clientId: string,
  clientSecret: string
): Promise<string> {
  const res = await fetch(`https://login.microsoftonline.com/${azureTenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://api.businesscentral.dynamics.com/.default",
      grant_type: "client_credentials"
    })
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(
      `Entra-Token-Anfrage fehlgeschlagen (${res.status}): ${body.slice(0, 300)}`
    )
  }

  const data = await res.json()
  if (!data.access_token) {
    throw new Error("Entra-Antwort enthielt keinen access_token")
  }
  return data.access_token
}

export async function buildDynamicsClientForTenant(
  tenantId: string
): Promise<DynamicsApiClient | null> {
  const row = await prisma.dynamicsIntegration.findUnique({ where: { tenantId } })
  if (!row) return null

  const clientSecret = decryptSecret(row.clientSecretEncrypted)
  const token = await getEntraToken(row.azureTenantId, row.clientId, clientSecret)
  const baseUrl = `${row.baseUrl.replace(/\/+$/, "")}/${row.environment}/api/v2.0`

  return {
    async listCompanies(): Promise<BcCompany[]> {
      const res = await fetch(`${baseUrl}/companies`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
      })
      if (!res.ok) {
        throw new Error(`Dynamics API /companies (${res.status})`)
      }
      const data = await res.json()
      return (data.value ?? []) as BcCompany[]
    },
    async listVendors(companyId: string) {
      const res = await fetch(`${baseUrl}/companies(${companyId})/vendors?$top=500`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
      })
      if (!res.ok) {
        throw new Error(`Dynamics API /vendors (${res.status})`)
      }
      const data = await res.json()
      return (data.value ?? []) as BcVendor[]
    },
    async listPurchaseOrders(companyId: string) {
      const res = await fetch(`${baseUrl}/companies(${companyId})/purchaseOrders?$top=500&$orderby=orderDate desc`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
      })
      if (!res.ok) {
        throw new Error(`Dynamics API /purchaseOrders (${res.status})`)
      }
      const data = await res.json()
      return (data.value ?? []) as BcPurchaseOrder[]
    },
    async listPurchaseInvoices(companyId: string) {
      const res = await fetch(`${baseUrl}/companies(${companyId})/purchaseInvoices?$top=500&$orderby=invoiceDate desc`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
      })
      if (!res.ok) {
        throw new Error(`Dynamics API /purchaseInvoices (${res.status})`)
      }
      const data = await res.json()
      return (data.value ?? []) as BcPurchaseInvoice[]
    }
  }
}

// ---------------------------------------------------------------
// Connection-Test
// ---------------------------------------------------------------

export type ConnectionTestResult =
  | { success: true; companies: Array<{ id: string; name: string; displayName: string }> }
  | { success: false; stage: "encryption" | "entra" | "api"; error: string }

export async function testDynamicsConnection(
  azureTenantId: string,
  clientId: string,
  clientSecret: string,
  environment: string,
  baseUrl: string
): Promise<ConnectionTestResult> {
  const cleanBase = baseUrl.trim().replace(/\/+$/, "") || "https://api.businesscentral.dynamics.com/v2.0"

  // Stage 1: Entra Token
  let token: string
  try {
    token = await getEntraToken(azureTenantId, clientId, clientSecret)
  } catch (e) {
    return {
      success: false,
      stage: "entra",
      error: e instanceof Error ? e.message : "Entra-Token konnte nicht geholt werden"
    }
  }

  // Stage 2: Dynamics API Call
  try {
    const url = `${cleanBase}/${environment}/api/v2.0/companies`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      return {
        success: false,
        stage: "api",
        error: `Dynamics API Zugriff fehlgeschlagen (${res.status}): ${body.slice(0, 300)}`
      }
    }
    const data = await res.json()
    const companies = (data.value ?? []).map((c: BcCompany) => ({
      id: c.id,
      name: c.name,
      displayName: c.displayName ?? c.name
    }))
    return { success: true, companies }
  } catch (e) {
    return {
      success: false,
      stage: "api",
      error: e instanceof Error ? e.message : "Dynamics API Call fehlgeschlagen"
    }
  }
}
