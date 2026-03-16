export type TenantPolicyMaturity = "read_only_grundlage" | "definiert" | "in_vorbereitung" | "verfuegbar"

export type TenantPolicyCategory = {
  id: string
  title: string
  description: string
  maturity: TenantPolicyMaturity
  owner: "Tenant-Administration" | "Datenschutz" | "Compliance" | "IT-Sicherheit" | "Plattformbetrieb"
  policies: string[]
  nextMilestone: string
  reviewHint: string
}

export const TENANT_POLICY_MATURITY_LABELS: Record<TenantPolicyMaturity, string> = {
  read_only_grundlage: "Read-only Grundlage",
  definiert: "Definiert",
  in_vorbereitung: "In Vorbereitung",
  verfuegbar: "Verfügbar"
}

export const TENANT_POLICY_CATEGORIES: TenantPolicyCategory[] = [
  {
    id: "zugriff-session",
    title: "Zugriff & Session",
    description:
      "Grundsätze für Sitzungsdauer, erneute Authentifizierung und administrativen Zugang im Tenant-Kontext.",
    maturity: "verfuegbar",
    owner: "IT-Sicherheit",
    policies: [
      "Session-Timeout pro Tenant ist als editierbare Einstellung verfügbar",
      "MFA-Pflicht für privilegierte Rollen ist tenant-gebunden konfigurierbar",
      "Weitere Zugriffspolicies bleiben im aktuellen Schritt read-only"
    ],
    reviewHint: "Review-Hinweis: Session- und MFA-Konfiguration regelmäßig mit SSO-Konzept abstimmen.",
    nextMilestone: "Erweiterung um differenzierte Admin-Access-Policies und Durchsetzungsregeln"
  },
  {
    id: "rollen-freigaben",
    title: "Rollen & administrative Freigaben",
    description:
      "Richtlinienrahmen für Rollenänderungen, Freigabeprinzipien und nachvollziehbare Verantwortlichkeiten.",
    maturity: "definiert",
    owner: "Tenant-Administration",
    policies: [
      "Rollenänderungen nur mit dokumentierter Begründung im Zielbild vorgesehen",
      "Vier-Augen-Freigabe für privilegierte Änderungen als Governance-Standard definiert",
      "Trennung von antragstellender und freigebender Rolle im Ausbaupfad festgehalten"
    ],
    reviewHint: "Review-Hinweis: Freigabeschwellen pro Organisation abstimmen.",
    nextMilestone: "Freigabe-Workflows mit Audit-Feldern und Versionshistorie"
  },
  {
    id: "datenschutz-aufbewahrung",
    title: "Datenschutz & Aufbewahrung",
    description:
      "Einordnung von Retention-Grundsätzen, Löschanlässen und organisatorischen Prüfpfaden für Datenschutzthemen.",
    maturity: "verfuegbar",
    owner: "Datenschutz",
    policies: [
      "Standard-Aufbewahrungstage sind als tenant-gebundene Einstellung verfügbar",
      "Auto-Archivierung nach Freigabe ist pro Tenant konfigurierbar",
      "Erweiterte Lösch- und Betroffenenprozesse bleiben im aktuellen Schritt read-only"
    ],
    reviewHint: "Review-Hinweis: Aufbewahrungswerte mit AVV und internem Löschkonzept abstimmen.",
    nextMilestone: "Retention-Matrix nach Dokumententypen mit operationalisierten Löschläufen"
  },
  {
    id: "ki-oversight",
    title: "KI-Nutzung & Human Oversight",
    description:
      "Richtlinienübersicht zur KI-gestützten Prüfung mit menschlicher Einordnung bei kritischen Entscheidungen.",
    maturity: "read_only_grundlage",
    owner: "Compliance",
    policies: [
      "KI-Hinweise sind als Prüfunterstützung, nicht als automatische Entscheidung eingeordnet",
      "Review-Pflicht für risikorelevante Ergebnisse als Governance-Anforderung festgehalten",
      "Transparenzhinweise für KI-gestützte Prüfkontexte im Ausbaupfad vorgesehen"
    ],
    reviewHint: "Review-Hinweis: Human-in-the-Loop-Kriterien je Anwendungsfall präzisieren.",
    nextMilestone: "Verbindliche Oversight-Parameter mit dokumentierten Eskalationspfaden"
  },
  {
    id: "nachweise-audit",
    title: "Nachweise & Audit",
    description:
      "Struktur für Nachweispflichten, Exportregeln und revisionsnahe Dokumentation von Governance-Entscheidungen.",
    maturity: "verfuegbar",
    owner: "Compliance",
    policies: [
      "Audit-Einträge als zentrale Nachweisquelle im Tenant-Kontext verankert",
      "Export-Hinweise und Zweckbezug für Nachweisanfragen dokumentiert",
      "Review-Intervalle für Governance-Richtlinien als organisatorischer Standard definiert"
    ],
    reviewHint: "Review-Hinweis: Export- und Aufbewahrungspfad regelmäßig mit Compliance abstimmen.",
    nextMilestone: "Signierte Nachweis-Pakete und versionierte Audit-Exports"
  },
  {
    id: "integrationen-datenweitergabe",
    title: "Integrationen & Datenweitergabe",
    description:
      "Richtlinienrahmen zur Freigabe externer Anbindungen und zur Einordnung von Datenflüssen in Integrationsszenarien.",
    maturity: "in_vorbereitung",
    owner: "Plattformbetrieb",
    policies: [
      "Integrationsfreigaben mit organisatorischem Prüfkontext als Zielprozess definiert",
      "Datenweitergabe nur entlang dokumentierter Integrationszwecke vorgesehen",
      "SSO-/SCIM-nahe Integrationsprüfungen als Governance-Schritt hinterlegt"
    ],
    reviewHint: "Review-Hinweis: Integrationskriterien mit IT und Datenschutz gemeinsam bewerten.",
    nextMilestone: "Freigaberegister für Integrationen mit tenantbezogenem Prüfprotokoll"
  }
]
