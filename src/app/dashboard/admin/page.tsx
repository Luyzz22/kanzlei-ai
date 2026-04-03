export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">⚙️ Administration</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Benutzerverwaltung</h1>
      <p className="mt-2 text-[14px] text-gray-500">Nutzer, Rollen und Mandanteneinstellungen verwalten.</p>

      <div className="mt-10 space-y-4">
        {[
          { emoji: "👥", title: "Team-Mitglieder", desc: "Nutzer einladen, Rollen zuweisen (Admin, Anwalt, Assistent)", status: "Verfügbar" },
          { emoji: "🏢", title: "Mandanten-Einstellungen", desc: "Tenant-Name, Slug und Konfiguration verwalten", status: "Verfügbar" },
          { emoji: "🔑", title: "SSO / Microsoft Entra ID", desc: "Single Sign-On Konfiguration für Enterprise-Kunden", status: "Vorbereitet" },
          { emoji: "📊", title: "Nutzungsstatistiken", desc: "API-Aufrufe, Analysen und Token-Verbrauch pro Mandant", status: "Geplant" },
        ].map((item) => (
          <div key={item.title} className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5">
            <span className="text-[22px]">{item.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-semibold text-gray-900">{item.title}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.status === "Verfügbar" ? "bg-emerald-100 text-emerald-700" : item.status === "Vorbereitet" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>{item.status}</span>
              </div>
              <p className="mt-1 text-[13px] text-gray-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
