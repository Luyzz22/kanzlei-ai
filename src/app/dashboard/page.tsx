export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Willkommen im Dashboard</h1>
      <p className="text-muted-foreground">
        Hier sehen Sie demnächst Aktenübersichten, KI-Assistenzläufe und Compliance-Protokolle.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">Offene Vorgänge: 12</div>
        <div className="rounded-lg border p-4">Heute verarbeitet: 34 Dokumente</div>
        <div className="rounded-lg border p-4">Aktive Nutzer: 7</div>
      </div>
    </div>
  )
}
