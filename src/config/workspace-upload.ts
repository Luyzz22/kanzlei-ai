export type Dokumentquelle = {
  kanal: string
  beschreibung: string
  status: "Verfügbar" | "Geplant" | "Vorbereitet"
}

export type IntakeFeld = {
  label: string
  wert: string
  hinweis?: string
}

export type Verarbeitungsoption = {
  titel: string
  beschreibung: string
  status: "Aktiv" | "Vorbereitet"
}

export const dokumentquellen: Dokumentquelle[] = [
  {
    kanal: "Manueller Datei-Upload durch Sachbearbeitung",
    beschreibung: "Primärer Eingang für Vertragsentwürfe, Nachträge und mandatsbezogene Unterlagen im Workspace.",
    status: "Vorbereitet"
  },
  {
    kanal: "Gesicherter Mandantenbereich",
    beschreibung: "Geplanter Upload-Eingang für externe Mandanten mit tenant-gebundener Zuordnung.",
    status: "Geplant"
  },
  {
    kanal: "Strukturierter E-Mail-Eingang",
    beschreibung: "Option für spätere Verarbeitung eingehender Dokumente über definierte Postfächer und Regelwerke.",
    status: "Geplant"
  },
  {
    kanal: "API-Intake aus Drittsystemen",
    beschreibung: "Anbindung für ERP- oder Vertragsmanagement-Systeme mit revisionssicherer Protokollierung.",
    status: "Geplant"
  }
]

export const intakeMetadatenFelder: IntakeFeld[] = [
  { label: "Dokumenttitel", wert: "Dienstleistungsvertrag IT-Betrieb 2026" },
  { label: "Dokumenttyp", wert: "Dienstleistungsvertrag" },
  { label: "Organisation / Mandant", wert: "Muster Holding GmbH" },
  { label: "Zuständige Person", wert: "Dr. Anna Weber" },
  {
    label: "Kurzbeschreibung / Gegenstand",
    wert: "Vertragsprüfung zu Leistungsumfang, SLA-Klauseln und Haftungsregelungen.",
    hinweis: "Wird künftig für Priorisierung, Routing und Suchindizierung genutzt."
  },
  { label: "Priorität", wert: "Mittel" },
  {
    label: "Gewünschter Prüfpfad",
    wert: "Juristische Erstprüfung, Datenschutz-Sichtung, Freigabe durch Mandatsleitung"
  }
]

export const verarbeitungsoptionen: Verarbeitungsoption[] = [
  {
    titel: "Tenant-Bindung und Organisationskontext",
    beschreibung: "Alle Vorgänge werden im Ausbau verbindlich einem Mandantenkontext zugeordnet und protokolliert.",
    status: "Vorbereitet"
  },
  {
    titel: "Prüfpfad-Vorbelegung",
    beschreibung: "Regelbasierte Zuordnung zu Review-Queue, Datenschutzprüfung und Freigabeebenen.",
    status: "Vorbereitet"
  },
  {
    titel: "Audit-Logging für Intake-Ereignisse",
    beschreibung: "Eingänge, Metadatenänderungen und Übergaben werden später revisionssicher erfasst.",
    status: "Aktiv"
  }
]
