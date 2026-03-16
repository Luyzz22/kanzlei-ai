import { InfoPanel } from "@/components/marketing/info-panel"
import { PageHero } from "@/components/marketing/page-hero"
import { PageShell } from "@/components/marketing/page-shell"

export default function ImpressumPage() {
  return (
    <PageShell width="narrow">
      <PageHero
        eyebrow="Rechtliches"
        title="Impressum"
        description="Anbieterkennzeichnung und Kontaktdaten für KanzleiAI als Grundlage für transparente Kommunikation mit Kanzleien, Rechtsabteilungen und Aufsichtspartnern."
      />
      <InfoPanel title="Anbieterangaben" tone="default">
        <p>
          KanzleiAI GmbH<br />
          Musterstraße 1<br />
          10115 Berlin
        </p>
        <p className="mt-3">
          Vertreten durch: Max Mustermann<br />
          E-Mail: kontakt@kanzlei-ai.de
        </p>
        <p className="mt-3">Registergericht: Amtsgericht Berlin-Charlottenburg · HRB 123456</p>
      </InfoPanel>
    </PageShell>
  )
}
