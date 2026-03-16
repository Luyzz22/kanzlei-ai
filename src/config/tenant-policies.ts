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
    maturity: "definiert",
    owner: "IT-Sicherheit",
    policies: [
      "Session-Limits für Standard- und Admin-Sitzungen als Richtlinienrahmen dokumentiert",
      "Erhöhte Anforderungen für administrative Zugriffe im Organisationskontext vorgesehen",
      "MFA-Pflicht für privilegierte Rollen im Ausbaupfad beschrieben"
    ],
    reviewHint: "Review-Hinweis: Abgleich mit SSO-/MFA-Konzept je Tenant erforderlich.",
    nextMilestone: "Technische Policy-Parameter mit Tenant-spezifischer Konfiguration"
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
    maturity: "in_vorbereitung",
    owner: "Datenschutz",
    policies: [
      "Aufbewahrungsfristen nach Dokumentenart als Registry-Struktur vorbereitet",
      "Lösch- und Sperrlogik für tenantbezogene Daten im Review",
      "Hinweiswege für Betroffenenanfragen in der Governance-Dokumentation vorgesehen"
    ],
    reviewHint: "Review-Hinweis: Abgleich mit AVV- und internen Löschkonzepten.",
    nextMilestone: "Retention-Matrix mit tenantbezogenen Fristprofilen"
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
