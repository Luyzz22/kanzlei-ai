export type SupportKategorie = {
  titel: string
  zweck: string
  anwendungsfaelle: string[]
  einordnung: "Betriebsnah" | "Organisatorisch" | "Compliance-relevant"
}

export const supportKategorien: SupportKategorie[] = [
  {
    titel: "Technisches Problem",
    zweck: "Einordnung von Störungen, Darstellungsfehlern oder unerwartetem Verhalten in der Anwendung.",
    anwendungsfaelle: [
      "Seite lädt nicht wie erwartet",
      "Ansicht oder Tabelleninhalt ist unvollständig",
      "Fehlermeldung im Workspace-Kontext"
    ],
    einordnung: "Betriebsnah"
  },
  {
    titel: "Zugriffsproblem",
    zweck: "Klärung von Login-, Berechtigungs- oder Rollenzugriffen für Nutzer und Teams.",
    anwendungsfaelle: [
      "Anmeldung nicht möglich",
      "Fehlende Berechtigungen trotz Rollenbedarf",
      "Unklarer Zugriff auf Admin-Bereiche"
    ],
    einordnung: "Organisatorisch"
  },
  {
    titel: "Compliance- oder Nachweisfrage",
    zweck: "Hilft bei regulatorischen Rückfragen zu Dokumentation, Protokollierung und Governance-Kontext.",
    anwendungsfaelle: [
      "Einordnung von Audit-Informationen",
      "Fragen zu Datenschutz- oder AVV-Inhalten",
      "Nachweisbedarf für interne Gremien"
    ],
    einordnung: "Compliance-relevant"
  },
  {
    titel: "Integrations- oder Admin-Anfrage",
    zweck: "Sammelt Fragen zu Admin-Einstellungen, Schnittstellenvorbereitung und Betriebskonfiguration.",
    anwendungsfaelle: [
      "Vorbereitung von Integrationsanforderungen",
      "Abstimmung zu Rollen- und Teamstrukturen",
      "Einordnung geplanter Betriebsänderungen"
    ],
    einordnung: "Organisatorisch"
  },
  {
    titel: "Vertrieb / Enterprise-Anfrage",
    zweck: "Adressiert organisatorische und beschaffungsnahe Fragestellungen jenseits des operativen Supports.",
    anwendungsfaelle: [
      "Fragen zum Enterprise-Einsatzrahmen",
      "Abstimmung zu Beschaffungsprozessen",
      "Einordnung von Stakeholder-Anforderungen"
    ],
    einordnung: "Betriebsnah"
  }
]
