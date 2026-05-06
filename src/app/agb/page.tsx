import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "AGB \u2014 Allgemeine Gesch\u00E4ftsbedingungen",
  description: "Allgemeine Gesch\u00E4ftsbedingungen f\u00FCr die Nutzung der KanzleiAI-Plattform von SBS Deutschland GmbH & Co. KG."
}

const sections = [
  {
    title: "\u00A7 1 Geltungsbereich",
    content: `(1) Diese Allgemeinen Gesch\u00E4ftsbedingungen (AGB) gelten f\u00FCr alle Vertr\u00E4ge zwischen der SBS Deutschland GmbH & Co. KG, In der Dell 19, 69469 Weinheim (nachfolgend \u201EAnbieter\u201C) und dem Kunden \u00FCber die Nutzung der KanzleiAI-Plattform und sonstiger damit verbundener Dienstleistungen.\n\n(2) Abweichende Bedingungen des Kunden werden nicht anerkannt, es sei denn, der Anbieter stimmt ihrer Geltung ausdr\u00FCcklich schriftlich zu.\n\n(3) Die Plattform richtet sich ausschlie\u00DFlich an Unternehmer im Sinne des \u00A7 14 BGB. Eine Nutzung durch Verbraucher ist nicht vorgesehen.`
  },
  {
    title: "\u00A7 2 Vertragsgegenstand",
    content: `(1) Der Anbieter stellt dem Kunden eine cloudbasierte Software zur KI-gest\u00FCtzten Vertragsanalyse, Risikobewertung, Klauselpr\u00FCfung und Dokumentenverarbeitung zur Verf\u00FCgung (\u201EKanzleiAI\u201C).\n\n(2) Die Plattform erm\u00F6glicht insbesondere: automatische Risikobewertung von Vertragsdokumenten, strukturierte Extraktion von Vertragsdaten (Parteien, Fristen, Klauseln), KI-gest\u00FCtzte Handlungsempfehlungen und Formulierungsvorschl\u00E4ge, Vertragsvergleich (AGB vs. AEB), Verhandlungssimulation sowie Integration mit Drittsystemen (z.B. Microsoft Dynamics 365).\n\n(3) Der genaue Leistungsumfang richtet sich nach dem vom Kunden gew\u00E4hlten Tarif gem\u00E4\u00DF der aktuellen Preisliste.\n\n(4) KanzleiAI stellt keine Rechtsberatung dar. S\u00E4mtliche KI-generierten Ergebnisse sind maschinell erzeugte Vorschl\u00E4ge und ersetzen nicht die Pr\u00FCfung durch qualifizierte Juristen.`
  },
  {
    title: "\u00A7 3 Vertragsschluss",
    content: `(1) Die Darstellung der Dienstleistungen auf der Website stellt kein rechtlich bindendes Angebot dar.\n\n(2) Der Vertrag kommt durch Registrierung des Kunden und Best\u00E4tigung durch den Anbieter zustande.\n\n(3) Der Kunde ist verpflichtet, bei der Registrierung wahrheitsgem\u00E4\u00DFe und vollst\u00E4ndige Angaben zu machen.`
  },
  {
    title: "\u00A7 4 Preise und Zahlung",
    content: `(1) Es gelten die zum Zeitpunkt der Bestellung g\u00FCltigen Preise gem\u00E4\u00DF der Preisliste auf der Website.\n\n(2) Alle Preise verstehen sich zuz\u00FCglich der gesetzlichen Mehrwertsteuer.\n\n(3) Die Zahlung erfolgt per Rechnung mit einem Zahlungsziel von 14 Tagen, per Kreditkarte oder per SEPA-Lastschrift.\n\n(4) Bei Zahlungsverzug ist der Anbieter berechtigt, den Zugang zur Plattform vor\u00FCbergehend zu sperren.`
  },
  {
    title: "\u00A7 5 Nutzungsrechte",
    content: `(1) Der Anbieter r\u00E4umt dem Kunden f\u00FCr die Vertragsdauer ein nicht ausschlie\u00DFliches, nicht \u00FCbertragbares Recht zur Nutzung der Plattform im Rahmen des vereinbarten Tarifs ein.\n\n(2) Der Kunde darf die Plattform nur f\u00FCr eigene gesch\u00E4ftliche Zwecke nutzen. Eine Unterlizenzierung ist nicht gestattet.\n\n(3) Die auf der Plattform generierten Analyseergebnisse d\u00FCrfen vom Kunden f\u00FCr interne Zwecke frei verwendet werden. Eine kommerzielle Weiterverbreitung der KI-Ergebnisse an Dritte ist ohne vorherige Zustimmung nicht gestattet.`
  },
  {
    title: "\u00A7 6 Pflichten des Kunden",
    content: `(1) Der Kunde ist verpflichtet, seine Zugangsdaten geheim zu halten und vor dem Zugriff Dritter zu sch\u00FCtzen.\n\n(2) Der Kunde stellt sicher, dass er zur Verarbeitung der hochgeladenen Dokumente berechtigt ist und keine Rechte Dritter verletzt werden.\n\n(3) Der Kunde ist f\u00FCr die Richtigkeit der von ihm eingegebenen Daten verantwortlich.\n\n(4) Der Kunde tr\u00E4gt die alleinige Verantwortung f\u00FCr alle auf Basis der KI-Analyse getroffenen Entscheidungen. Eine fachliche Pr\u00FCfung der Ergebnisse durch qualifiziertes Personal (Human-in-the-Loop) ist erforderlich.`
  },
  {
    title: "\u00A7 7 Mandantentrennung und Datenisolation",
    content: `(1) Die Plattform ist mandantenf\u00E4hig. Die Daten jedes Kunden (Mandanten) sind logisch voneinander getrennt.\n\n(2) Der Anbieter stellt durch technische und organisatorische Ma\u00DFnahmen sicher, dass kein unbefugter Zugriff auf Daten anderer Mandanten m\u00F6glich ist.\n\n(3) Analyseergebnisse, Dokumente und Nutzerdaten sind ausschlie\u00DFlich dem jeweiligen Mandanten zugeordnet.`
  },
  {
    title: "\u00A7 8 Verf\u00FCgbarkeit",
    content: `(1) Der Anbieter bem\u00FCht sich um eine Verf\u00FCgbarkeit der Plattform von 99% im Jahresmittel.\n\n(2) Hiervon ausgenommen sind geplante Wartungsfenster sowie Zeiten, in denen die Server aufgrund von technischen Problemen, die nicht im Einflussbereich des Anbieters liegen, nicht erreichbar sind.\n\n(3) Bei Ausfall von KI-Drittanbietern (z.B. Anthropic, OpenAI, Google) kann die Analysefunktionalit\u00E4t vor\u00FCbergehend eingeschr\u00E4nkt sein. Dies stellt keinen Mangel dar.`
  },
  {
    title: "\u00A7 9 Datenschutz",
    content: `(1) Der Anbieter verarbeitet personenbezogene Daten des Kunden ausschlie\u00DFlich im Rahmen der geltenden Datenschutzgesetze, insbesondere der DSGVO.\n\n(2) Einzelheiten zur Datenverarbeitung sind in der Datenschutzerkl\u00E4rung geregelt.\n\n(3) Auf Wunsch des Kunden schlie\u00DFt der Anbieter eine Auftragsverarbeitungsvereinbarung (AVV) gem\u00E4\u00DF Art. 28 DSGVO ab.\n\n(4) Kundendaten werden nicht zum Training von KI-Modellen verwendet (Zero Data Retention bei allen KI-Anbietern).`
  },
  {
    title: "\u00A7 10 K\u00FCnstliche Intelligenz und Transparenz",
    content: `(1) Die Plattform setzt Systeme der K\u00FCnstlichen Intelligenz ein, insbesondere gro\u00DFe Sprachmodelle (LLMs) der Anbieter Anthropic (Claude), OpenAI und Google (Gemini).\n\n(2) KI-generierte Inhalte werden in der Benutzeroberfl\u00E4che als solche gekennzeichnet. Der Anbieter erf\u00FCllt die Transparenzpflichten gem\u00E4\u00DF Art. 50 der Verordnung (EU) 2024/1689 (KI-Verordnung).\n\n(3) Der Anbieter \u00FCbernimmt keine Gew\u00E4hrleistung f\u00FCr die inhaltliche Richtigkeit, Vollst\u00E4ndigkeit oder rechtliche Belastbarkeit der KI-generierten Ergebnisse.\n\n(4) Der Einsatz der Plattform ersetzt keine qualifizierte Rechtsberatung. Die letzte Entscheidungsverantwortung liegt stets beim Nutzer.`
  },
  {
    title: "\u00A7 11 Haftung",
    content: `(1) Der Anbieter haftet unbeschr\u00E4nkt f\u00FCr Vorsatz und grobe Fahrl\u00E4ssigkeit sowie f\u00FCr Sch\u00E4den aus der Verletzung des Lebens, des K\u00F6rpers oder der Gesundheit.\n\n(2) Bei leichter Fahrl\u00E4ssigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten). Die Haftung ist in diesem Fall auf den vorhersehbaren, vertragstypischen Schaden begrenzt.\n\n(3) Die Haftung f\u00FCr mittelbare Sch\u00E4den, entgangenen Gewinn und Datenverlust ist bei leichter Fahrl\u00E4ssigkeit ausgeschlossen.\n\n(4) Die Haftung nach dem Produkthaftungsgesetz bleibt unber\u00FChrt.\n\n(5) Eine Haftung f\u00FCr die Richtigkeit von KI-generierten Analysen, Risikobewertungen und Handlungsempfehlungen ist ausgeschlossen. Der Kunde tr\u00E4gt die Verantwortung f\u00FCr die fachliche Pr\u00FCfung und Umsetzung.`
  },
  {
    title: "\u00A7 12 Vertragsdauer und K\u00FCndigung",
    content: `(1) Der Vertrag wird auf unbestimmte Zeit geschlossen und kann von beiden Parteien mit einer Frist von 30 Tagen zum Monatsende gek\u00FCndigt werden, sofern kein abweichender Tarif mit Mindestlaufzeit vereinbart wurde.\n\n(2) Das Recht zur au\u00DFerordentlichen K\u00FCndigung aus wichtigem Grund bleibt unber\u00FChrt.\n\n(3) Die K\u00FCndigung bedarf der Textform (E-Mail ist ausreichend).\n\n(4) Nach Vertragsende werden die Daten des Kunden gem\u00E4\u00DF den Regelungen der Datenschutzerkl\u00E4rung und der AVV gel\u00F6scht oder zur\u00FCckgegeben.`
  },
  {
    title: "\u00A7 13 \u00C4nderungen der AGB",
    content: `(1) Der Anbieter beh\u00E4lt sich vor, diese AGB mit Wirkung f\u00FCr die Zukunft zu \u00E4ndern. \u00C4nderungen werden dem Kunden mindestens 30 Tage vor Inkrafttreten in Textform mitgeteilt.\n\n(2) Widerspricht der Kunde nicht innerhalb von 30 Tagen nach Zugang der \u00C4nderungsmitteilung, gelten die ge\u00E4nderten AGB als angenommen. Der Anbieter wird den Kunden in der \u00C4nderungsmitteilung auf diese Rechtsfolge hinweisen.`
  },
  {
    title: "\u00A7 14 Schlussbestimmungen",
    content: `(1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.\n\n(2) Gerichtsstand f\u00FCr alle Streitigkeiten aus diesem Vertrag ist Mannheim, sofern der Kunde Kaufmann, juristische Person des \u00F6ffentlichen Rechts oder \u00F6ffentlich-rechtliches Sonderverm\u00F6gen ist.\n\n(3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der \u00FCbrigen Bestimmungen unber\u00FChrt. An die Stelle der unwirksamen Bestimmung tritt eine wirksame Bestimmung, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am n\u00E4chsten kommt.`
  }
]

export default function AGBPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
      <h1 className="text-[1.75rem] font-semibold tracking-tight text-gray-950">Allgemeine Gesch\u00E4ftsbedingungen</h1>
      <p className="mt-2 text-[14px] text-gray-500">G\u00FCltig f\u00FCr die Nutzung der KanzleiAI-Plattform</p>
      <p className="mt-1 text-[12px] text-gray-400">Stand: Mai 2026</p>

      <div className="mt-10 space-y-8">
        {sections.map((s, i) => (
          <div key={i}>
            <h2 className="text-[15px] font-semibold text-gray-900">{s.title}</h2>
            <div className="mt-3 rounded-xl border border-gray-100 bg-white p-5 text-[14px] leading-relaxed text-gray-700 whitespace-pre-line">
              {s.content}
            </div>
          </div>
        ))}

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-[13px] font-semibold text-amber-800">Wichtiger Hinweis</p>
          <p className="mt-1 text-[13px] text-amber-700">KanzleiAI ist ein Assistenzsystem und ersetzt keine qualifizierte Rechtsberatung. Alle KI-generierten Ergebnisse bed\u00FCrfen der fachlichen Pr\u00FCfung durch den Nutzer (Human-in-the-Loop-Prinzip).</p>
        </div>

        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Kontakt</h2>
          <div className="mt-3 rounded-xl border border-gray-100 bg-white p-5 text-[14px] text-gray-700">
            <p className="font-medium text-gray-900">SBS Deutschland GmbH & Co. KG</p>
            <p>In der Dell 19, 69469 Weinheim</p>
            <p className="mt-1">Telefon: +49 (0) 6201 24469</p>
            <p>E-Mail: <Link href="mailto:ki@sbsdeutschland.de" className="font-medium text-[#003856]">ki@sbsdeutschland.de</Link></p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-6">
          <Link href="/datenschutz" className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-medium text-[#003856] transition-colors hover:bg-stone-50">Datenschutz</Link>
          <Link href="/avv" className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-medium text-[#003856] transition-colors hover:bg-stone-50">AVV</Link>
          <Link href="/impressum" className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-medium text-[#003856] transition-colors hover:bg-stone-50">Impressum</Link>
        </div>
      </div>
    </main>
  )
}
