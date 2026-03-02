export default function DatenschutzPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-3xl font-semibold">Datenschutzerklärung</h1>
      <p>
        Diese Plattform verarbeitet personenbezogene Daten ausschließlich auf Grundlage von Art. 6 DSGVO. Alle
        Daten werden verschlüsselt übertragen und in europäischen Rechenzentren gespeichert.
      </p>
      <h2 className="text-xl font-medium">Zwecke der Verarbeitung</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>Bereitstellung der Plattformfunktionen für Kanzlei-Mitarbeitende</li>
        <li>Sicherheits- und Audit-Logging zur Nachvollziehbarkeit</li>
        <li>Vertragsabwicklung und Support</li>
      </ul>
    </main>
  )
}
