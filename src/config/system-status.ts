export type SystemStatusModul = {
  bereich: string
  status: "Statusdarstellung im Aufbau" | "Betriebsnahe Sicht" | "Monitoring-Ausbau vorgesehen"
  beschreibung: string
}

export const systemstatusModule: SystemStatusModul[] = [
  {
    bereich: "Web-Anwendung",
    status: "Betriebsnahe Sicht",
    beschreibung: "Die Oberfläche wird produktnah betrieben; diese Seite zeigt derzeit eine kuratierte Statusdarstellung ohne Echtzeitanspruch."
  },
  {
    bereich: "API- und Integrationsschnittstellen",
    status: "Monitoring-Ausbau vorgesehen",
    beschreibung: "Schnittstellen-Transparenz wird schrittweise ausgebaut. Aktuell erfolgt die Einordnung als vorbereitete Betriebsinformation."
  },
  {
    bereich: "Authentifizierung",
    status: "Betriebsnahe Sicht",
    beschreibung: "Anmelde- und Zugriffsbereiche werden operativ überwacht; eine externe Live-Statuspublikation ist derzeit nicht umgesetzt."
  },
  {
    bereich: "Dokumenten-Workspace",
    status: "Statusdarstellung im Aufbau",
    beschreibung: "Funktionen für Dokumente, Intake und Review werden aktuell als read-only Fundament erweitert."
  },
  {
    bereich: "Audit- und Governance-Bereiche",
    status: "Monitoring-Ausbau vorgesehen",
    beschreibung: "Governance-nahe Transparenz wird mit künftigen Audit- und Betriebsmetriken systematisch ergänzt."
  }
]

export const betriebsprinzipien = [
  "Statuskommunikation bleibt konservativ und unterscheidet klar zwischen bestätigten Informationen und Planungsstand.",
  "Vorfälle und wesentliche Änderungen werden mittelfristig über standardisierte, nachvollziehbare Updates kommuniziert.",
  "Betriebsinformationen werden entlang von Zuständigkeit, Mandantenkontext und Governance-Anforderungen strukturiert bereitgestellt."
]
