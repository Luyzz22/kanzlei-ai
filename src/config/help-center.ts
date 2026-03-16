export type HilfeThema = {
  titel: string
  beschreibung: string
  hilfepunkte: string[]
  links?: { label: string; href: string }[]
}

export const hilfeThemen: HilfeThema[] = [
  {
    titel: "Einstieg & Zugriff",
    beschreibung: "Grundlagen für Anmeldung, Arbeitsbereich und sichere Zugriffseinordnung im Kanzleikontext.",
    hilfepunkte: [
      "Anmeldung und Sitzungsverwaltung",
      "Orientierung im Workspace und Dashboard",
      "Sichere Nutzung in geteilten Kanzlei-Umgebungen"
    ],
    links: [{ label: "Administration", href: "/dashboard/admin" }]
  },
  {
    titel: "Verträge & Dokumente",
    beschreibung: "Hilfe zur strukturierten Dokumentenarbeit von der Übersicht bis zur Detailprüfung.",
    hilfepunkte: [
      "Dokumentenliste und Filterkontext",
      "Dokumentdetail und Prüfhinweise",
      "Intake-Vorbereitung für neue Vorgänge"
    ],
    links: [
      { label: "Dokumenten-Workspace", href: "/workspace/dokumente" },
      { label: "Upload / Intake", href: "/workspace/upload" }
    ]
  },
  {
    titel: "Prüfung & Freigaben",
    beschreibung: "Einordnung von Review-Prioritäten, Zuständigkeiten und offenen Entscheidungspfaden.",
    hilfepunkte: [
      "Review Queue lesen und priorisieren",
      "Entscheidungsstatus verstehen",
      "Fristen- und Eskalationskontext interpretieren"
    ],
    links: [{ label: "Review Queue", href: "/workspace/review-queue" }]
  },
  {
    titel: "Administration & Rollen",
    beschreibung: "Hilfen für Organisationssteuerung, Mitgliederverwaltung und kontrollierte Rechtevergabe.",
    hilfepunkte: [
      "Mitgliederübersicht und Rollenkontext",
      "Administrationsbereiche und Betriebsrollen",
      "Abgrenzung Fach- und Admin-Tätigkeiten"
    ],
    links: [{ label: "Admin-Mitglieder", href: "/dashboard/admin/members" }]
  },
  {
    titel: "Datenschutz & Nachweise",
    beschreibung: "Schneller Einstieg in Datenschutz-, AVV- und Trust-Kontext für interne oder externe Prüfung.",
    hilfepunkte: [
      "Datenschutz- und AVV-Seiten nutzen",
      "Trust-Center-Inhalte für Nachweise einordnen",
      "Audit-nahe Informationen nachvollziehen"
    ],
    links: [
      { label: "Datenschutz", href: "/datenschutz" },
      { label: "Trust Center", href: "/trust-center" }
    ]
  },
  {
    titel: "Support & Betriebsinformationen",
    beschreibung: "Wann Support erforderlich ist und wie Betriebsinformationen strukturiert gelesen werden.",
    hilfepunkte: [
      "Support-Anliegen korrekt kategorisieren",
      "Betriebsstatus konservativ interpretieren",
      "Weiterleitung über belastbare Kontaktwege"
    ],
    links: [
      { label: "Support", href: "/support" },
      { label: "Systemstatus", href: "/systemstatus" }
    ]
  }
]
