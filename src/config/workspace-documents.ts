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
