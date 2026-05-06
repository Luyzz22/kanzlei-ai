import "server-only"

import { prisma } from "@/lib/prisma"
import { buildDynamicsClientForTenant, type DynamicsApiClient } from "@/lib/dynamics/core"
import { writeAuditEvent } from "@/lib/audit-core"

type SyncResult = {
  entity: string
  created: number
  updated: number
  total: number
  durationMs: number
}

// ---------------------------------------------------------------
// Vendors Sync — Upsert mit Change Detection
// ---------------------------------------------------------------
export async function syncVendors(
  tenantId: string,
  companyId: string,
  client: DynamicsApiClient,
  actorId: string
): Promise<SyncResult> {
  const start = Date.now()
  const vendors = await client.listVendors(companyId)
  let created = 0
  let updated = 0

  for (const v of vendors) {
    const result = await prisma.dynamicsVendor.upsert({
      where: { tenantId_bcId: { tenantId, bcId: v.id } },
      create: {
        tenantId,
        bcId: v.id,
        number: v.number,
        displayName: v.displayName,
        addressLine1: v.addressLine1 ?? null,
        city: v.city ?? null,
        country: v.country ?? null,
        phoneNumber: v.phoneNumber ?? null,
        email: v.email ?? null,
        balance: v.balance != null ? v.balance : null,
        currencyCode: v.currencyCode ?? null,
        lastModifiedAt: v.lastModifiedDateTime ? new Date(v.lastModifiedDateTime) : null,
        syncedAt: new Date(),
      },
      update: {
        number: v.number,
        displayName: v.displayName,
        addressLine1: v.addressLine1 ?? null,
        city: v.city ?? null,
        country: v.country ?? null,
        phoneNumber: v.phoneNumber ?? null,
        email: v.email ?? null,
        balance: v.balance != null ? v.balance : null,
        currencyCode: v.currencyCode ?? null,
        lastModifiedAt: v.lastModifiedDateTime ? new Date(v.lastModifiedDateTime) : null,
        syncedAt: new Date(),
      }
    })
    // Prisma upsert doesn't tell us if it was create or update — check createdAt vs syncedAt
    const isNew = result.syncedAt.getTime() - (result.lastModifiedAt?.getTime() ?? 0) < 2000
    if (isNew) created++
    else updated++
  }

  // Vendor-Contract Matching nach Sync
  await matchVendorsToContracts(tenantId)

  await writeAuditEvent({
    tenantId,
    actorId,
    action: "dynamics.sync.vendors",
    resourceType: "dynamics_integration",
    metadata: { created, updated, total: vendors.length, durationMs: Date.now() - start }
  })

  return { entity: "vendors", created, updated, total: vendors.length, durationMs: Date.now() - start }
}

// ---------------------------------------------------------------
// Purchase Orders Sync
// ---------------------------------------------------------------
export async function syncPurchaseOrders(
  tenantId: string,
  companyId: string,
  client: DynamicsApiClient,
  actorId: string
): Promise<SyncResult> {
  const start = Date.now()
  const orders = await client.listPurchaseOrders(companyId)
  let synced = 0

  for (const po of orders) {
    await prisma.dynamicsPurchaseOrder.upsert({
      where: { tenantId_bcId: { tenantId, bcId: po.id } },
      create: {
        tenantId,
        bcId: po.id,
        number: po.number,
        orderDate: po.orderDate ? new Date(po.orderDate) : null,
        vendorId: po.vendorId ?? null,
        vendorNumber: po.vendorNumber ?? null,
        vendorName: po.vendorName ?? null,
        status: po.status ?? null,
        totalAmount: po.totalAmountIncludingTax != null ? po.totalAmountIncludingTax : null,
        currencyCode: po.currencyCode ?? null,
        lastModifiedAt: po.lastModifiedDateTime ? new Date(po.lastModifiedDateTime) : null,
        syncedAt: new Date(),
      },
      update: {
        number: po.number,
        orderDate: po.orderDate ? new Date(po.orderDate) : null,
        vendorId: po.vendorId ?? null,
        vendorNumber: po.vendorNumber ?? null,
        vendorName: po.vendorName ?? null,
        status: po.status ?? null,
        totalAmount: po.totalAmountIncludingTax != null ? po.totalAmountIncludingTax : null,
        currencyCode: po.currencyCode ?? null,
        lastModifiedAt: po.lastModifiedDateTime ? new Date(po.lastModifiedDateTime) : null,
        syncedAt: new Date(),
      }
    })
    synced++
  }

  await writeAuditEvent({
    tenantId,
    actorId,
    action: "dynamics.sync.purchaseOrders",
    resourceType: "dynamics_integration",
    metadata: { total: orders.length, durationMs: Date.now() - start }
  })

  return { entity: "purchaseOrders", created: synced, updated: 0, total: orders.length, durationMs: Date.now() - start }
}

// ---------------------------------------------------------------
// Purchase Invoices Sync
// ---------------------------------------------------------------
export async function syncPurchaseInvoices(
  tenantId: string,
  companyId: string,
  client: DynamicsApiClient,
  actorId: string
): Promise<SyncResult> {
  const start = Date.now()
  const invoices = await client.listPurchaseInvoices(companyId)
  let synced = 0

  for (const inv of invoices) {
    await prisma.dynamicsPurchaseInvoice.upsert({
      where: { tenantId_bcId: { tenantId, bcId: inv.id } },
      create: {
        tenantId,
        bcId: inv.id,
        number: inv.number,
        invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate) : null,
        dueDate: inv.dueDate ? new Date(inv.dueDate) : null,
        vendorId: inv.vendorId ?? null,
        vendorNumber: inv.vendorNumber ?? null,
        vendorName: inv.vendorName ?? null,
        status: inv.status ?? null,
        totalAmount: inv.totalAmountIncludingTax != null ? inv.totalAmountIncludingTax : null,
        remainingAmount: inv.remainingAmount != null ? inv.remainingAmount : null,
        currencyCode: inv.currencyCode ?? null,
        lastModifiedAt: inv.lastModifiedDateTime ? new Date(inv.lastModifiedDateTime) : null,
        syncedAt: new Date(),
      },
      update: {
        number: inv.number,
        invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate) : null,
        dueDate: inv.dueDate ? new Date(inv.dueDate) : null,
        vendorId: inv.vendorId ?? null,
        vendorNumber: inv.vendorNumber ?? null,
        vendorName: inv.vendorName ?? null,
        status: inv.status ?? null,
        totalAmount: inv.totalAmountIncludingTax != null ? inv.totalAmountIncludingTax : null,
        remainingAmount: inv.remainingAmount != null ? inv.remainingAmount : null,
        currencyCode: inv.currencyCode ?? null,
        lastModifiedAt: inv.lastModifiedDateTime ? new Date(inv.lastModifiedDateTime) : null,
        syncedAt: new Date(),
      }
    })
    synced++
  }

  await writeAuditEvent({
    tenantId,
    actorId,
    action: "dynamics.sync.purchaseInvoices",
    resourceType: "dynamics_integration",
    metadata: { total: invoices.length, durationMs: Date.now() - start }
  })

  return { entity: "purchaseInvoices", created: synced, updated: 0, total: invoices.length, durationMs: Date.now() - start }
}

// ---------------------------------------------------------------
// Full Sync — alle drei Entities in einem Durchlauf
// ---------------------------------------------------------------
export async function syncAll(
  tenantId: string,
  actorId: string
): Promise<{ results: SyncResult[]; error?: string }> {
  const config = await prisma.dynamicsIntegration.findUnique({ where: { tenantId } })
  if (!config?.companyId) {
    return { results: [], error: "Keine Company konfiguriert" }
  }

  const client = await buildDynamicsClientForTenant(tenantId)
  if (!client) {
    return { results: [], error: "Dynamics Client konnte nicht initialisiert werden" }
  }

  const results: SyncResult[] = []

  results.push(await syncVendors(tenantId, config.companyId, client, actorId))
  results.push(await syncPurchaseOrders(tenantId, config.companyId, client, actorId))
  results.push(await syncPurchaseInvoices(tenantId, config.companyId, client, actorId))

  await prisma.dynamicsIntegration.update({
    where: { tenantId },
    data: { lastSyncAt: new Date(), lastSyncStatus: "success", lastSyncError: null }
  })

  return { results }
}

// ---------------------------------------------------------------
// Vendor-Contract Matching
// Verknuepft BC-Vendors mit analysierten Vertraegen ueber OrgName
// ---------------------------------------------------------------
async function matchVendorsToContracts(tenantId: string): Promise<void> {
  const vendors = await prisma.dynamicsVendor.findMany({
    where: { tenantId },
    select: { id: true, displayName: true }
  })

  // Alle Organisation-Namen aus analysierten Vertraegen
  const documents = await prisma.document.findMany({
    where: { tenantId, organizationName: { not: "Nicht zugeordnet" } },
    select: { organizationName: true }
  })

  const orgNames = [...new Set(
    documents.map(d => d.organizationName).filter(n => n.length > 2)
  )]

  for (const vendor of vendors) {
    const vendorLower = vendor.displayName.toLowerCase().trim()
    let bestMatch: string | null = null
    let bestScore = 0

    for (const org of orgNames) {
      const orgLower = org.toLowerCase().trim()
      const score = fuzzyMatchScore(vendorLower, orgLower)
      if (score > bestScore && score >= 0.6) {
        bestScore = score
        bestMatch = org
      }
    }

    if (bestMatch) {
      await prisma.dynamicsVendor.update({
        where: { id: vendor.id },
        data: { matchedOrgName: bestMatch, matchConfidence: bestScore }
      })
    }
  }
}

/**
 * Einfacher Fuzzy-Match: Jaccard-Aehnlichkeit auf Wort-Ebene
 * + exakter Substring-Bonus.
 */
function fuzzyMatchScore(a: string, b: string): number {
  // Exakter Match
  if (a === b) return 1.0
  // Substring-Match (einer enthaelt den anderen)
  if (a.includes(b) || b.includes(a)) return 0.85

  // Wort-basierter Jaccard
  const wordsA = new Set(a.split(/\s+/).filter(w => w.length > 1))
  const wordsB = new Set(b.split(/\s+/).filter(w => w.length > 1))
  if (wordsA.size === 0 || wordsB.size === 0) return 0

  let intersection = 0
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++
  }

  const union = wordsA.size + wordsB.size - intersection
  return union > 0 ? intersection / union : 0
}
