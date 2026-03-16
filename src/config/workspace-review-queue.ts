export type ReviewPrioritaet = "Hoch" | "Mittel" | "Niedrig"
export type ReviewStatus = "Offen" | "In Prüfung" | "Rückfrage erforderlich" | "Freigabereif" | "Eskalation empfohlen"

export type ReviewQueueEintrag = {
  id: string
  vorgang: string
  bezugsdokument: string
  bezugsdokumentId?: string
  organisation: string
  prioritaet: ReviewPrioritaet
  zustaendig: string
  faelligkeit: string
  entscheidungsstatus: ReviewStatus
}

export const reviewFilteroptionen = {
  status: ["Alle Status", "Offen", "In Prüfung", "Rückfrage erforderlich", "Freigabereif", "Eskalation empfohlen"],
  prioritaet: ["Alle Prioritäten", "Hoch", "Mittel", "Niedrig"],
  organisation: ["Alle Organisationen", "Muster Holding GmbH", "Nordstern Personal GmbH", "Kanzlei Behrens & Partner"],
  zustaendigkeit: ["Alle Zuständigkeiten", "Dr. Anna Weber", "Svenja Koch", "Laura Henning", "Compliance Office"]
} as const

export const reviewQueueDaten: ReviewQueueEintrag[] = [
  {
    id: "REV-2026-044",
    vorgang: "Datenschutzprüfung offen",
    bezugsdokument: "Auftragsverarbeitung Cloud-Personalakten",
    bezugsdokumentId: "DOC-2026-014",
    organisation: "Muster Holding GmbH",
    prioritaet: "Hoch",
    zustaendig: "Svenja Koch",
    faelligkeit: "22.03.2026",
    entscheidungsstatus: "In Prüfung"
  },
  {
    id: "REV-2026-051",
    vorgang: "Freigabe ausstehend",
    bezugsdokument: "NDA Projekt Orion",
    bezugsdokumentId: "DOC-2026-021",
    organisation: "Kanzlei Behrens & Partner",
    prioritaet: "Mittel",
    zustaendig: "Dr. Markus Stein",
    faelligkeit: "25.03.2026",
    entscheidungsstatus: "Rückfrage erforderlich"
  },
  {
    id: "REV-2026-057",
    vorgang: "Gegenzeichnung ausstehend",
    bezugsdokument: "Externe Datenschutzberatung 2026",
    bezugsdokumentId: "DOC-2026-035",
    organisation: "Nordstern Personal GmbH",
    prioritaet: "Hoch",
    zustaendig: "Laura Henning",
    faelligkeit: "19.03.2026",
    entscheidungsstatus: "Eskalation empfohlen"
  },
  {
    id: "REV-2026-062",
    vorgang: "Fristprüfung erforderlich",
    bezugsdokument: "SLA-Nachtrag Q2/2026",
    bezugsdokumentId: "DOC-2026-041",
    organisation: "Muster Holding GmbH",
    prioritaet: "Niedrig",
    zustaendig: "Compliance Office",
    faelligkeit: "30.03.2026",
    entscheidungsstatus: "Offen"
  },
  {
    id: "REV-2026-069",
    vorgang: "Risikobewertung vor Freigabe",
    bezugsdokument: "Rahmenvertrag Beratungsleistungen DACH",
    bezugsdokumentId: "DOC-2025-118",
    organisation: "Kanzlei Behrens & Partner",
    prioritaet: "Mittel",
    zustaendig: "Dr. Anna Weber",
    faelligkeit: "28.03.2026",
    entscheidungsstatus: "Freigabereif"
  }
]
