import "server-only"

/**
 * Audit Event Action Registry
 *
 * Zentrale Klassifizierung aller im System emittierten Audit-Action-Strings.
 * Pro Aktion:
 * - category:  Filter-Gruppe in der UI
 * - severity:  Risikoeinstufung für KPI "Hochrisiko-Events"
 * - label:     Anzeigename in der Timeline (DE)
 * - emoji:     Visueller Anker
 *
 * Bei neuen Actions: hier registrieren. Unbekannte Actions werden
 * mit "Andere"-Kategorie und neutral angezeigt — kein Bruch.
 */

export type AuditCategory =
  | "analyse"        // KI-Pipeline, Findings
  | "dokument"       // Upload, Verarbeitung, Export
  | "review"         // Freigabeworkflow, Findings reviewed
  | "admin"          // Tenant-, User-, Config-Aktionen
  | "integration"    // Dynamics, SCIM, externe Systeme
  | "compliance"     // Retention, Governance
  | "security"       // Auth, Access, Permissions
  | "andere"

export type AuditSeverity = "info" | "warning" | "critical"

export type AuditActionMeta = {
  category: AuditCategory
  severity: AuditSeverity
  label: string
  emoji: string
}

const REGISTRY: Record<string, AuditActionMeta> = {
  // ── Analyse-Pipeline ────────────────────────────────────────────────
  "analysis.requested":           { category: "analyse",     severity: "info",     label: "Analyse angefordert",         emoji: "🧠" },
  "analysis.pipeline.started":    { category: "analyse",     severity: "info",     label: "Pipeline gestartet",          emoji: "⚙️" },
  "analysis.pipeline.completed":  { category: "analyse",     severity: "info",     label: "Pipeline abgeschlossen",      emoji: "✅" },
  "analysis.pipeline.failed":     { category: "analyse",     severity: "critical", label: "Pipeline fehlgeschlagen",     emoji: "⚠️" },
  "analysis.completed":           { category: "analyse",     severity: "info",     label: "Analyse abgeschlossen",       emoji: "🧠" },
  "analysis.failed":              { category: "analyse",     severity: "critical", label: "Analyse fehlgeschlagen",      emoji: "⚠️" },
  "analysis.finding.reviewed":    { category: "review",      severity: "info",     label: "Finding reviewed",            emoji: "✅" },

  // ── Dokument-Lifecycle ───────────────────────────────────────────────
  "document.intake.created":      { category: "dokument",    severity: "info",     label: "Dokument erfasst",            emoji: "📥" },
  "document.file.stored":         { category: "dokument",    severity: "info",     label: "Datei gespeichert",           emoji: "💾" },
  "document.file.store_failed":   { category: "dokument",    severity: "warning",  label: "Speichern fehlgeschlagen",    emoji: "⚠️" },
  "document.file.downloaded":     { category: "dokument",    severity: "info",     label: "Original heruntergeladen",    emoji: "⬇️" },
  "document.processing.prepared": { category: "dokument",    severity: "info",     label: "Verarbeitung vorbereitet",    emoji: "⚙️" },
  "document.processing.started":  { category: "dokument",    severity: "info",     label: "Verarbeitung gestartet",      emoji: "🔄" },
  "document.processing.completed":{ category: "dokument",    severity: "info",     label: "Verarbeitung abgeschlossen",  emoji: "✅" },
  "document.processing.failed":   { category: "dokument",    severity: "warning",  label: "Verarbeitung fehlgeschlagen", emoji: "❌" },
  "document.processing.unsupported":{ category: "dokument",  severity: "warning",  label: "Format nicht unterstützt",    emoji: "⚠️" },
  "document.retention_expired":   { category: "compliance",  severity: "warning",  label: "Aufbewahrungsfrist abgelaufen", emoji: "🗑️" },

  // ── Review-Workflow ──────────────────────────────────────────────────
  "document.review.started":          { category: "review",  severity: "info",     label: "Review gestartet",          emoji: "🔍" },
  "document.review.approved":         { category: "review",  severity: "info",     label: "Review freigegeben",        emoji: "✅" },
  "document.review.archived":         { category: "review",  severity: "info",     label: "Review archiviert",         emoji: "📦" },
  "document.review.transition.denied":{ category: "review",  severity: "warning",  label: "Review-Übergang abgelehnt", emoji: "🚫" },
  "document.review.owner.assigned":   { category: "review",  severity: "info",     label: "Review-Owner zugewiesen",   emoji: "👤" },
  "document.review.due_date.updated": { category: "review",  severity: "info",     label: "Review-Deadline aktualisiert", emoji: "📅" },
  "document.comment.created":         { category: "review",  severity: "info",     label: "Kommentar erstellt",        emoji: "💬" },
  "document.finding.created":         { category: "review",  severity: "warning",  label: "Finding erstellt",          emoji: "🔴" },
  "document.finding.resolved":        { category: "review",  severity: "info",     label: "Finding geklärt",           emoji: "✅" },

  // ── Microsoft Dynamics 365 Integration ──────────────────────────────
  "dynamics.config.read":     { category: "integration", severity: "info",     label: "Dynamics-Config gelesen",  emoji: "🔍" },
  "dynamics.config.upsert":   { category: "integration", severity: "info",     label: "Dynamics-Config geändert", emoji: "💾" },
  "dynamics.config.delete":   { category: "integration", severity: "warning",  label: "Dynamics-Config gelöscht", emoji: "🗑️" },
  "dynamics.connection.test": { category: "integration", severity: "info",     label: "Dynamics-Verbindung getestet", emoji: "🔌" },
  "dynamics.sync.run":        { category: "integration", severity: "info",     label: "Dynamics-Sync erfolgreich",emoji: "🔄" },
  "dynamics.sync.failed":     { category: "integration", severity: "warning",  label: "Dynamics-Sync fehlgeschlagen", emoji: "⚠️" },

  // ── SCIM / Identity ──────────────────────────────────────────────────
  "scim.group.patch":         { category: "admin",       severity: "info",     label: "SCIM Group patched",       emoji: "👥" },

  // ── Tenant-Governance ────────────────────────────────────────────────
  "tenant.approval-policies.updated": { category: "admin", severity: "info", label: "Freigaberichtlinie aktualisiert", emoji: "⚙️" },
}

const FALLBACK: AuditActionMeta = {
  category: "andere",
  severity: "info",
  label: "Aktion",
  emoji: "📋"
}

export function describeAction(action: string): AuditActionMeta {
  return REGISTRY[action] ?? {
    ...FALLBACK,
    label: action.replace(/[._]/g, " ")
  }
}

export const AUDIT_CATEGORIES: Array<{ key: AuditCategory | "alle"; label: string; emoji: string }> = [
  { key: "alle",        label: "Alle Events",   emoji: "📋" },
  { key: "analyse",     label: "Analyse",       emoji: "🧠" },
  { key: "dokument",    label: "Dokument",      emoji: "📄" },
  { key: "review",      label: "Review",        emoji: "✅" },
  { key: "integration", label: "Integration",   emoji: "🔌" },
  { key: "compliance",  label: "Compliance",    emoji: "📋" },
  { key: "admin",       label: "Admin",         emoji: "⚙️" },
  { key: "security",    label: "Security",      emoji: "🔐" },
  { key: "andere",      label: "Andere",        emoji: "📌" }
]

export const SEVERITY_TONE: Record<AuditSeverity, { bg: string; text: string; border: string }> = {
  info:     { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  warning:  { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  critical: { bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200" }
}
