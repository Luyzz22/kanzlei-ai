export default function AvvPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-3xl font-semibold">AVV-Template (Art. 28 DSGVO)</h1>
      <p>
        Dieses Muster dient als Grundlage für den Auftragsverarbeitungsvertrag zwischen der Kanzlei (Verantwortlicher)
        und der KanzleiAI GmbH (Auftragsverarbeiter).
      </p>
      <h2 className="text-xl font-medium">1. Gegenstand und Dauer</h2>
      <p>Verarbeitung juristischer Falldaten für die Dauer des Hauptvertrages.</p>
      <h2 className="text-xl font-medium">2. Technische und organisatorische Maßnahmen</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>Verschlüsselung at-rest und in-transit</li>
        <li>Rollenbasierte Zugriffskontrolle (RBAC)</li>
        <li>Protokollierung sicherheitsrelevanter Aktionen</li>
      </ul>
    </main>
  )
}
