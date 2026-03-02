import Link from "next/link"

export default function KiTransparenzPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-3xl font-semibold">KI-Transparenz</h1>
      <p>
        KanzleiAI stellt KI-Funktionen als unterstützendes Werkzeug für Kanzleien bereit. Die finale rechtliche
        Beurteilung bleibt stets Aufgabe der verantwortlichen Anwältinnen und Anwälte.
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Art des KI-Systems</h2>
        <p>
          KanzleiAI ist ein unterstützendes Legal-AI-System für juristische Arbeitsabläufe. Es handelt sich nicht um
          ein autonomes Entscheidungssystem und es trifft keine rechtsverbindlichen Entscheidungen ohne menschliche
          Mitwirkung.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Zweck und Funktionsweise</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Markierung relevanter Vertragsklauseln zur schnelleren Vorprüfung</li>
          <li>Hervorhebung potenzieller Risiken und auffälliger Formulierungen</li>
          <li>Erstellung von Entwürfen für Mandantenbriefe und interne Arbeitstexte</li>
        </ul>
        <p>
          Die KI-Ausgaben dienen der Effizienzsteigerung in der juristischen Vorarbeit und sind nicht als fehlerfreie
          Ergebnisse zu verstehen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Menschliche Kontrolle</h2>
        <p>
          Alle KI-Ergebnisse werden durch qualifizierte Mitarbeitende der Kanzlei geprüft, bewertet und freigegeben.
          Eine automatische Versendung oder Verwendung in der Mandatsarbeit ohne menschliche Freigabe erfolgt nicht.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Datenverarbeitung</h2>
        <p>
          Verarbeitet werden insbesondere bereitgestellte Dokumentinhalte, nutzerbezogene Metadaten sowie
          Nutzungsprotokolle zur Sicherheit und Nachvollziehbarkeit. Die Verarbeitung erfolgt DSGVO-konform in der EU
          unter Beachtung technischer und organisatorischer Schutzmaßnahmen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Grenzen und Risiken</h2>
        <p>
          KI-basierte Ausgaben können unvollständig, missverständlich oder im Einzelfall fehlerhaft sein. KanzleiAI ist
          ein Werkzeug und keine eigenständige Rechtsberatung. Für die finale rechtliche Bewertung und Entscheidung
          bleibt ausschließlich die Kanzlei verantwortlich.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Kontakt</h2>
        <p>
          Informationen zum Datenschutzkontakt finden Sie in unserer <Link href="/datenschutz" className="underline">Datenschutzerklärung</Link>.
        </p>
      </section>
    </main>
  )
}
