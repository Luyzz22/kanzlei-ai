export default function KiTransparenzPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-3xl font-semibold">KI-Transparenz</h1>
      <p className="text-muted-foreground">
        Diese Informationen erläutern den Einsatz von KI in KanzleiAI im Sinne von Transparenz- und
        Informationspflichten nach EU AI Act, DSGVO und berufsrechtlichen Anforderungen.
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Art des KI-Systems</h2>
        <p>
          KanzleiAI ist ein unterstützendes Legal-AI-System. Es handelt sich nicht um ein autonomes
          Entscheidungssystem und trifft keine rechtsverbindlichen Entscheidungen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Zweck und Funktionsweise</h2>
        <p>Die KI-Funktionen unterstützen juristische Teams insbesondere bei folgenden Aufgaben:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Markierung relevanter Vertragsklauseln</li>
          <li>Hervorhebung potenzieller Risiken und Auffälligkeiten</li>
          <li>Erstellung von Entwürfen für Mandantenbriefe und Schriftsatzbestandteile</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Menschliche Kontrolle</h2>
        <p>
          Alle Ausgaben der KI sind Vorschläge. Anwältinnen und Anwälte prüfen, bewerten und verantworten sämtliche
          Ergebnisse. Eine automatische Versendung an Mandanten ohne vorherige menschliche Freigabe erfolgt nicht.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Datenverarbeitung</h2>
        <p>
          Je nach Nutzung können Vertragsinhalte, Kommunikationsdaten, Aktenmetadaten sowie nutzerbezogene
          Protokolldaten verarbeitet werden. Die Verarbeitung erfolgt DSGVO-konform in der EU auf Grundlage eines
          Auftragsverarbeitungsvertrags.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Grenzen und Risiken</h2>
        <p>
          KI-Systeme können unvollständige oder fehlerhafte Ergebnisse liefern. Es besteht insbesondere das Risiko von
          Auslassungen, missverständlichen Formulierungen oder unzutreffender Priorisierung. Daher ist stets eine
          qualifizierte menschliche Prüfung erforderlich. Die KI ist ein Werkzeug und ersetzt keine Rechtsberatung.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Kontakt</h2>
        <p>
          Bei Fragen zur KI-Nutzung und Datenverarbeitung wenden Sie sich bitte an den in der Datenschutzerklärung
          genannten Datenschutzkontakt unter <strong>kontakt@kanzlei-ai.de</strong>.
        </p>
      </section>
    </main>
  )
}
