import Link from "next/link"

import { Button } from "@/components/ui/button"

const preise = [
  { name: "Starter", preis: "49€", details: "Für kleine Kanzleien mit bis zu 3 Nutzern." },
  { name: "Professional", preis: "149€", details: "Für wachsende Teams mit erweiterten Automationen." },
  { name: "Enterprise", preis: "Auf Anfrage", details: "Individuelle Integrationen inkl. AVV und SLA." }
]

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-16 p-6">
      <section className="space-y-6 py-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">KanzleiAI für sichere Kanzlei-Workflows</h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Automatisieren Sie Recherche, Vertragsprüfung und Mandantenkommunikation – DSGVO-konform, revisionssicher
          und speziell für juristische Teams in Deutschland entwickelt.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link href="/dashboard">Zum Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/datenschutz">Datenschutz prüfen</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-4" id="pricing">
        <h2 className="text-2xl font-semibold">Preise</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {preise.map((plan) => (
            <article key={plan.name} className="rounded-lg border p-6">
              <h3 className="text-xl font-medium">{plan.name}</h3>
              <p className="mt-1 text-2xl font-bold">{plan.preis}</p>
              <p className="mt-3 text-sm text-muted-foreground">{plan.details}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
