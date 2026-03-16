export type DokumentTyp =
  | "Mandatsvereinbarung"
  | "Auftragsverarbeitungsvertrag"
  | "NDA"
  | "Dienstleistungsvertrag"
  | "Rahmenvertrag"
  | "Nachtrag"

export type DokumentStatus = "Entwurf" | "In Prüfung" | "Freigegeben" | "Archiviert"

export type Pruefstatus = "Ungeprüft" | "Juristisch geprüft" | "Freigabe ausstehend" | "Risiko markiert"

export type WorkspaceDokument = {
  id: string
  dokument: string
  typ: DokumentTyp
  organisation: string
  status: DokumentStatus
  verantwortlich: string
  letzteAenderung: string
  pruefstatus: Pruefstatus
}

export type WorkspaceDokumentDetail = WorkspaceDokument & {
  gegenstand: string
  kurzbeschreibung: string
  version: string
  referenz: string
  frist?: string
  freigabekontext: string
  risikohinweis: string
  bearbeitungsverantwortung: string
}

export const filterOptionen = {
  dokumenttyp: ["Alle Typen", "Mandatsvereinbarung", "Auftragsverarbeitungsvertrag", "NDA", "Dienstleistungsvertrag", "Rahmenvertrag", "Nachtrag"],
  status: ["Alle Status", "Entwurf", "In Prüfung", "Freigegeben", "Archiviert"],
  organisation: ["Alle Organisationen", "Müller & Partner Rechtsanwälte", "Nordstern Immobilien GmbH", "Alpengrün IT Services", "Bergmann Logistik AG"],
  pruefstatus: ["Alle Prüfstatus", "Ungeprüft", "Juristisch geprüft", "Freigabe ausstehend", "Risiko markiert"]
} as const

export const dokumentenliste: WorkspaceDokument[] = [
  {
    id: "DOC-2026-001",
    dokument: "Mandatsvereinbarung Arbeitsrecht 2026",
    typ: "Mandatsvereinbarung",
    organisation: "Müller & Partner Rechtsanwälte",
    status: "Freigegeben",
    verantwortlich: "Dr. Anna Weber",
    letzteAenderung: "14.03.2026",
    pruefstatus: "Juristisch geprüft"
  },
  {
    id: "DOC-2026-014",
    dokument: "AV-Vertrag Personalakten-Cloud",
    typ: "Auftragsverarbeitungsvertrag",
    organisation: "Alpengrün IT Services",
    status: "In Prüfung",
    verantwortlich: "Svenja Koch",
    letzteAenderung: "12.03.2026",
    pruefstatus: "Freigabe ausstehend"
  },
  {
    id: "DOC-2026-021",
    dokument: "NDA Due-Diligence Projekt Orion",
    typ: "NDA",
    organisation: "Bergmann Logistik AG",
    status: "Entwurf",
    verantwortlich: "Dr. Markus Stein",
    letzteAenderung: "10.03.2026",
    pruefstatus: "Ungeprüft"
  },
  {
    id: "DOC-2026-035",
    dokument: "Dienstleistungsvertrag Externe Datenschutzberatung",
    typ: "Dienstleistungsvertrag",
    organisation: "Nordstern Immobilien GmbH",
    status: "In Prüfung",
    verantwortlich: "Laura Henning",
    letzteAenderung: "08.03.2026",
    pruefstatus: "Risiko markiert"
  },
  {
    id: "DOC-2025-118",
    dokument: "Rahmenvertrag Standortbetreuung DACH",
    typ: "Rahmenvertrag",
    organisation: "Bergmann Logistik AG",
    status: "Archiviert",
    verantwortlich: "Dr. Anna Weber",
    letzteAenderung: "28.02.2026",
    pruefstatus: "Juristisch geprüft"
  },
  {
    id: "DOC-2026-041",
    dokument: "Nachtrag SLA-Anpassung Q2/2026",
    typ: "Nachtrag",
    organisation: "Alpengrün IT Services",
    status: "Freigegeben",
    verantwortlich: "Svenja Koch",
    letzteAenderung: "06.03.2026",
    pruefstatus: "Juristisch geprüft"
  }
]

const dokumentenDetails: Record<string, Omit<WorkspaceDokumentDetail, keyof WorkspaceDokument>> = {
  "DOC-2026-001": {
    gegenstand: "Mandatsführung für arbeitsrechtliche Individual- und Kollektivthemen im Geschäftsjahr 2026",
    kurzbeschreibung:
      "Regelt die laufende arbeitsrechtliche Beratung inklusive Eskalationswegen, Dokumentationspflichten und Vertraulichkeitsanforderungen zwischen Kanzlei und Mandant.",
    version: "v1.3",
    referenz: "AZ-AR-2026-11",
    frist: "Regelprüfung bis 30.06.2026",
    freigabekontext: "Freigabe durch Partnerkreis nach juristischer Prüfung und kaufmännischer Gegenzeichnung.",
    risikohinweis: "Niedriges Vertragsrisiko; erhöhte Aufmerksamkeit bei Fristwahrung in Kündigungsschutzfällen.",
    bearbeitungsverantwortung: "Federführung: Dr. Anna Weber; Stellvertretung: Compliance Office Arbeitsrecht"
  },
  "DOC-2026-014": {
    gegenstand: "Auftragsverarbeitung von Personalakten in einer EU-basierten Cloud-Umgebung",
    kurzbeschreibung:
      "Definiert technische und organisatorische Maßnahmen, Unterauftragsverhältnisse sowie Melde- und Unterstützungsprozesse bei Datenschutzvorfällen.",
    version: "v0.9",
    referenz: "DSGVO-AVV-IT-44",
    frist: "Freigabeziel bis 22.03.2026",
    freigabekontext: "Interne Datenschutzstelle und IT-Sicherheitsbeauftragte prüfen letzte Klauseländerungen.",
    risikohinweis: "Mittleres Risiko wegen geplanter Einbindung eines zusätzlichen Subprozessors.",
    bearbeitungsverantwortung: "Federführung: Svenja Koch; Abstimmung mit Datenschutzkoordination"
  },
  "DOC-2026-021": {
    gegenstand: "Vertraulichkeitsrahmen für Due-Diligence-Unterlagen im Projekt Orion",
    kurzbeschreibung:
      "Sichert den Austausch sensibler Finanz- und Betriebsdaten in der Vorverhandlungsphase ab und regelt Haftungsgrenzen bei Pflichtverletzungen.",
    version: "v0.4",
    referenz: "M&A-ORION-NDA-7",
    freigabekontext: "Entwurfsstand vor Erstprüfung; Freigabe erst nach Risikobewertung durch Partner und Mandatsleitung.",
    risikohinweis: "Erhöhtes Risiko durch noch offene Regelung zur Vertragsstrafe bei Informationsabfluss.",
    bearbeitungsverantwortung: "Federführung: Dr. Markus Stein; Review durch M&A-Team"
  },
  "DOC-2026-035": {
    gegenstand: "Externe Datenschutzberatung inklusive TOM-Review und DSFA-Begleitung",
    kurzbeschreibung:
      "Legt Leistungsumfang, Reaktionszeiten sowie Dokumentationspflichten für laufende Datenschutzberatung fest.",
    version: "v1.1",
    referenz: "DSB-OPS-2026-03",
    frist: "Nachverhandlung bis 18.03.2026",
    freigabekontext: "Freigabe ausstehend wegen offener Haftungsbegrenzung und Nachweisführung bei Subdienstleistern.",
    risikohinweis: "Risiko markiert aufgrund unklarer Eskalationsmechanik bei Datenschutzverletzungen.",
    bearbeitungsverantwortung: "Federführung: Laura Henning; juristische Zweitprüfung geplant"
  },
  "DOC-2025-118": {
    gegenstand: "Rahmenbedingungen für standortübergreifende Rechts- und Beratungsleistungen im DACH-Raum",
    kurzbeschreibung:
      "Historischer Rahmenvertrag zur standardisierten Mandatsabwicklung, derzeit archiviert als Referenz für Nachträge.",
    version: "v2.0",
    referenz: "RV-DACH-2025-118",
    freigabekontext: "Final freigegeben und revisionssicher abgelegt; nur noch lesender Zugriff.",
    risikohinweis: "Kein akuter Handlungsbedarf; bei Wiederverwendung auf aktualisierte Datenschutzklauseln achten.",
    bearbeitungsverantwortung: "Archivverantwortung: Legal Operations"
  },
  "DOC-2026-041": {
    gegenstand: "Anpassung bestehender Service-Level-Vereinbarungen für Q2/2026",
    kurzbeschreibung:
      "Nachtrag zur Präzisierung von Reaktionszeiten, Servicefenstern und Nachweispflichten im operativen Betrieb.",
    version: "v1.0",
    referenz: "SLA-NTR-2026-Q2",
    frist: "Nächste turnusmäßige Prüfung bis 30.09.2026",
    freigabekontext: "Fachbereich und Rechtsabteilung haben freigegeben; operative Umsetzung gestartet.",
    risikohinweis: "Niedriges Risiko, sofern KPI-Nachweise quartalsweise dokumentiert werden.",
    bearbeitungsverantwortung: "Federführung: Svenja Koch; Monitoring durch Service Governance"
  }
}

export function getWorkspaceDokumentById(id: string): WorkspaceDokument | undefined {
  return dokumentenliste.find((dokument) => dokument.id === id)
}

export function getWorkspaceDokumentDetailById(id: string): WorkspaceDokumentDetail | undefined {
  const basisdaten = getWorkspaceDokumentById(id)
  const detaildaten = dokumentenDetails[id]

  if (!basisdaten || !detaildaten) {
    return undefined
  }

  return {
    ...basisdaten,
    ...detaildaten
  }
}
