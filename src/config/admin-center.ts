export type AdminCenterAvailability = "verfügbar" | "in_vorbereitung" | "enterprise_plan"

export type AdminCenterSection = {
  id: string
  title: string
  summary: string
  availability: AdminCenterAvailability
  owner: "Tenant-Administration" | "Sicherheit" | "Compliance" | "Betrieb" | "Plattform"
  href?: string
  nextMilestone: string
}

export const ADMIN_CENTER_SECTIONS: AdminCenterSection[] = [
  {
    id: "tenant-organisation",
    title: "Tenant / Organisation",
    summary:
      "Mandantenstammdaten, Organisationskontext und verantwortliche Ansprechpartner für revisionsfähige Betriebsprozesse.",
    availability: "in_vorbereitung",
    owner: "Tenant-Administration",
    nextMilestone: "Tenant-Profil, Vertragskontext und Freigabe-Workflow für Stammdatenänderungen"
  },
  {
    id: "membership-roles",
    title: "Mitglieder & Rollen",
    summary:
      "Verwaltung von Benutzerzuordnungen und rollenbasierten Berechtigungen inklusive späterer Vier-Augen-Freigaben.",
    availability: "in_vorbereitung",
    owner: "Tenant-Administration",
    href: "/dashboard/admin/members",
    nextMilestone: "Rollenänderung mit Vier-Augen-Freigabe und Audit-Pflichtfeldern"
  },
  {
    id: "security-access",
    title: "Sicherheit & Zugriff",
    summary:
      "Steuerung von Zugriffsrichtlinien, Authentifizierungsniveau und administrativen Sicherheitsvorgaben.",
    availability: "in_vorbereitung",
    owner: "Sicherheit",
    nextMilestone: "MFA-/Session-Policy, Admin-Zugriffskontrollen und Sicherheits-Baselines pro Tenant"
  },
  {
    id: "audit-evidence",
    title: "Audit & Nachweise",
    summary:
      "Nachvollziehbare Prüfspur für regulatorische Anforderungen, interne Kontrollen und Kunden-Audits.",
    availability: "verfügbar",
    owner: "Compliance",
    href: "/dashboard/audit",
    nextMilestone: "Filterprofile, Export-Historie und signierte Nachweis-Pakete"
  },
  {
    id: "privacy-retention",
    title: "Datenschutz & Aufbewahrung",
    summary:
      "Lebenszyklusregeln für Daten, Auskunfts- und Löschprozesse sowie dokumentierte Retention-Standards.",
    availability: "in_vorbereitung",
    owner: "Compliance",
    nextMilestone: "Tenant-Retention-Registry und operationalisierte DSGVO-Betroffenenprozesse"
  },
  {
    id: "integrations",
    title: "Integrationen (SCIM/SSO vorbereitet)",
    summary:
      "Vorbereitung und Betrieb externer Identitäts- und Provisioning-Anbindungen für Enterprise-Infrastrukturen.",
    availability: "in_vorbereitung",
    owner: "Plattform",
    nextMilestone: "Admin-Konsole für SSO-Metadaten, SCIM-Token-Rotation und Integrationsstatus"
  },
  {
    id: "billing-usage",
    title: "Abrechnung & Nutzung",
    summary:
      "Nutzungsmetriken, Kostenstellenbezug und abrechnungsrelevante Transparenz für Einkaufs- und Finance-Prozesse.",
    availability: "enterprise_plan",
    owner: "Betrieb",
    nextMilestone: "Grundlage für Metering, Verbrauchsberichte und planbasierte Kontingente"
  },
  {
    id: "ai-governance",
    title: "KI-Governance",
    summary:
      "Steuerung von Modellnutzung, Prompt-Richtlinien und Nachweisen für EU-AI-Act-konforme Betriebsführung.",
    availability: "enterprise_plan",
    owner: "Compliance",
    nextMilestone: "Model-Register, Prompt-Governance und Human-in-the-Loop-Richtlinien"
  }
]

export const ADMIN_CENTER_AVAILABILITY_LABELS: Record<AdminCenterAvailability, string> = {
  verfügbar: "Verfügbar",
  in_vorbereitung: "In Vorbereitung",
  enterprise_plan: "Nur Enterprise-Plan"
}
