/**
 * Cronus AG Demo-Fixtures für BC-Integration.
 *
 * Wird geladen wenn:
 *  – BC_DEMO_MODE=true gesetzt ist, ODER
 *  – kein DynamicsIntegration-Record für den aktuellen Tenant existiert
 *
 * Enthält 3 Verträge mit echten Enterprise-Risiken für DERMALOG-Demo.
 */

export type BcDemoContract = {
  id: string
  bcId: string
  title: string
  vendor: string
  contractType: string
  amount: number
  currency: string
  startDate: string
  endDate: string
  riskHint: "hoch" | "mittel" | "niedrig"
  riskDescription: string
  text: string
}

export const CRONUS_DEMO_CONTRACTS: BcDemoContract[] = [
  {
    id: "cronus-demo-001",
    bcId: "VLC-2024-017",
    title: "Lieferantenvertrag — Techvision Hardware GmbH",
    vendor: "Techvision Hardware GmbH",
    contractType: "Lieferantenvertrag",
    amount: 485000,
    currency: "EUR",
    startDate: "2024-01-15",
    endDate: "2027-01-14",
    riskHint: "hoch",
    riskDescription: "Automatische Verlängerung mit 12-monatiger Kündigungsfrist in §23",
    text: `LIEFERANTENVERTRAG

zwischen

DERMALOG Identification Systems GmbH
Bredowstraße 19, 22113 Hamburg
(nachfolgend „Auftraggeber")

und

Techvision Hardware GmbH
Musterstraße 45, 10115 Berlin
(nachfolgend „Lieferant")

§ 1 Vertragsgegenstand
Der Lieferant verpflichtet sich zur regelmäßigen Lieferung von IT-Hardware und Peripheriegeräten gemäß den jeweils aktuellen Bestellungen des Auftraggebers. Das Sortiment umfasst Workstations, Server-Hardware, Netzwerkkomponenten sowie zugehöriges Zubehör. Das jährliche Mindestauftragsvolumen beträgt EUR 485.000,00 netto.

§ 2 Laufzeit
Dieser Vertrag tritt mit Unterzeichnung durch beide Parteien in Kraft und hat eine Mindestlaufzeit von zwei (2) Jahren.

§ 3 Preise und Zahlungsbedingungen
Die Preise verstehen sich in Euro zuzüglich der gesetzlich gültigen Umsatzsteuer. Zahlungen sind innerhalb von 30 Tagen nach Rechnungsstellung ohne Abzug fällig. Bei Zahlungsverzug werden Zinsen in Höhe von 9 Prozentpunkten über dem Basiszinssatz berechnet. Der Lieferant behält sich das Recht vor, seine Preisliste halbjährlich anzupassen. Preiserhöhungen werden dem Auftraggeber vier (4) Wochen vor Inkrafttreten mitgeteilt und gelten als genehmigt, sofern der Auftraggeber nicht schriftlich widerspricht.

§ 4 Lieferung und Gefahrübergang
Lieferungen erfolgen frei Haus (DDP Hamburg). Die Gefahr geht mit Übergabe der Ware an den Auftraggeber über. Liefertermine sind unverbindlich, sofern nicht ausdrücklich schriftlich als verbindlich vereinbart. Bei Verzögerungen ist der Lieferant berechtigt, eine angemessene Nachfrist zu setzen.

§ 5 Mängelrüge und Gewährleistung
Offensichtliche Mängel sind innerhalb von 24 Stunden nach Eingang der Ware schriftlich zu rügen. Versteckte Mängel sind unverzüglich nach Entdeckung anzuzeigen. Die Gewährleistungsfrist beträgt zwölf (12) Monate ab Lieferung. Weitergehende Ansprüche des Auftraggebers, insbesondere auf Schadensersatz wegen Folgeschäden, sind ausgeschlossen, soweit gesetzlich zulässig.

§ 6 Haftung
Der Lieferant haftet nur bei Vorsatz und grober Fahrlässigkeit für Schäden an Eigentum und Vermögen des Auftraggebers. Bei leichter Fahrlässigkeit haftet der Lieferant nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten) und nur bis zur Höhe des vorhersehbaren, vertragstypischen Schadens, maximal jedoch bis zur Höhe des Jahresauftragsvolumens. Jede weitergehende Haftung, insbesondere für entgangenen Gewinn und mittelbare Schäden, ist ausgeschlossen.

§ 7 Aufrechnung und Zurückbehaltung
Dem Auftraggeber steht ein Recht zur Aufrechnung nur zu, wenn seine Gegenforderungen rechtskräftig festgestellt, unbestritten oder vom Lieferanten anerkannt worden sind. Das Recht des Auftraggebers, ein Zurückbehaltungsrecht auszuüben, ist auf Gegenforderungen aus demselben Vertragsverhältnis beschränkt.

§ 8 Datenschutz
Die Parteien verarbeiten personenbezogene Daten im Rahmen der Vertragserfüllung gemäß den jeweils geltenden datenschutzrechtlichen Bestimmungen.

§ 9 Geheimhaltung
Beide Parteien verpflichten sich, alle im Rahmen dieses Vertrages erlangten vertraulichen Informationen geheim zu halten und nur für Zwecke der Vertragserfüllung zu verwenden. Diese Verpflichtung gilt für die Dauer von zwei (2) Jahren nach Vertragsbeendigung.

§ 10 bis § 22 [Allgemeine Geschäftsbedingungen des Lieferanten]

§ 23 Vertragsdauer und Kündigung
Dieser Vertrag hat — abweichend von § 2 — eine Mindestlaufzeit von drei (3) Jahren ab dem Datum der Unterzeichnung durch beide Parteien. Nach Ablauf der Mindestlaufzeit verlängert sich der Vertrag automatisch um jeweils ein (1) weiteres Jahr, sofern er nicht mit einer Frist von zwölf (12) Monaten zum Ende der jeweiligen Vertragslaufzeit durch eingeschriebenen Brief gegenüber der anderen Partei gekündigt wird. Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. Als wichtiger Grund gilt insbesondere die Insolvenz einer Partei oder die schwerwiegende Verletzung wesentlicher Vertragspflichten.

§ 24 Salvatorische Klausel
Sollten einzelne Bestimmungen dieses Vertrages unwirksam oder undurchführbar sein, so berührt dies die Wirksamkeit der übrigen Bestimmungen nicht. Anstelle der unwirksamen Bestimmung tritt eine wirksame Regelung, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten kommt. Änderungen und Ergänzungen dieses Vertrages bedürfen der Schriftform.

§ 25 Gerichtsstand und anwendbares Recht
Gerichtsstand für alle Streitigkeiten aus und im Zusammenhang mit diesem Vertrag ist Hamburg. Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts (CISG).

Hamburg, 15. Januar 2024

DERMALOG Identification Systems GmbH          Techvision Hardware GmbH
___________________________                   ___________________________`
  },
  {
    id: "cronus-demo-002",
    bcId: "VLC-2024-031",
    title: "SaaS-Vertrag — CloudStack Technologies AG",
    vendor: "CloudStack Technologies AG",
    contractType: "SaaS-Vertrag",
    amount: 96000,
    currency: "EUR",
    startDate: "2024-03-01",
    endDate: "2025-02-28",
    riskHint: "hoch",
    riskDescription: "Datenverarbeitung in USA ohne DSGVO Art. 28 AVV — Gerichtsstand Delaware",
    text: `SOFTWARE-AS-A-SERVICE AGREEMENT (SAAS-VERTRAG)

zwischen

DERMALOG Identification Systems GmbH
Bredowstraße 19, 22113 Hamburg, Deutschland
(nachfolgend „Kunde")

und

CloudStack Technologies AG
Bahnhofstraße 12, 8001 Zürich, Schweiz
(nachfolgend „Anbieter")

§ 1 Leistungsgegenstand
Der Anbieter stellt dem Kunden die Cloud-Softwareplattform „CloudStack Analytics Suite" als Software-as-a-Service (SaaS) über das Internet zur Verfügung. Der Dienst umfasst Datenspeicherung, Verarbeitungsfunktionen und Analysewerkzeuge für Unternehmensdaten des Kunden. Der Jahresbetrag für die Nutzungsgebühr beträgt EUR 96.000,00 netto.

§ 2 Nutzungsrechte
Der Kunde erhält ein nicht-exklusives, nicht-übertragbares Recht zur Nutzung der Plattform ausschließlich für interne Geschäftszwecke während der Vertragslaufzeit.

§ 3 Verfügbarkeit
Der Anbieter bemüht sich um eine Verfügbarkeit der Plattform von 99 Prozent im Monatsdurchschnitt, ohne jedoch eine rechtlich verbindliche Zusicherung oder Garantie zu übernehmen. Geplante Wartungsfenster werden 24 Stunden im Voraus auf der Statusseite des Anbieters angekündigt. Service Credits oder sonstige Kompensationen bei Unterschreitung der angestrebten Verfügbarkeit sind nicht vorgesehen.

§ 4 Datenverarbeitung und Hosting
Der Anbieter verarbeitet alle Kundendaten, einschließlich etwaiger personenbezogener Daten, auf Servern in den Vereinigten Staaten von Amerika (Region US-East-1, betrieben durch Amazon Web Services, Inc., Seattle, WA, USA). Der Anbieter ist berechtigt, Unterauftragnehmer für den Betrieb der technischen Infrastruktur einzusetzen. Eine aktuelle Liste der Unterauftragnehmer ist auf der Unternehmenswebsite des Anbieters unter https://cloudstack.io/subprocessors veröffentlicht und kann jederzeit ohne vorherige Ankündigung geändert werden.

§ 5 Datenschutz und Einwilligung
Der Kunde erklärt sich durch Abschluss dieses Vertrages mit der Verarbeitung seiner Daten gemäß den aktuellen Datenschutzbestimmungen des Anbieters einverstanden, die unter https://cloudstack.io/privacy abrufbar sind. Der Anbieter behält sich das Recht vor, die Datenschutzbestimmungen jederzeit anzupassen; der Kunde wird per E-Mail über wesentliche Änderungen informiert. Weitergehende Datenschutzvereinbarungen zwischen den Parteien bestehen nicht.

§ 6 Datensicherheit
Der Anbieter implementiert nach eigenem Ermessen geeignete technische und organisatorische Maßnahmen zum Schutz der Kundendaten. Eine Verpflichtung zur Einhaltung bestimmter Sicherheitsstandards (z.B. ISO 27001, SOC 2) wird nicht übernommen.

§ 7 Haftung und Gewährleistung
7.1 Der Anbieter übernimmt keine Gewährleistung für die Fehlerfreiheit oder Vollständigkeit des Dienstes.
7.2 Jegliche Haftung des Anbieters für mittelbare Schäden, Folgeschäden, entgangenen Gewinn, Datenverlust oder Betriebsunterbrechungen ist vollständig ausgeschlossen.
7.3 Die Gesamthaftung des Anbieters ist auf den Betrag begrenzt, der vom Kunden in den letzten drei (3) Monaten vor dem schadensbegründenden Ereignis entrichtet wurde.
7.4 Der Haftungsausschluss gilt auch im Fall grober Fahrlässigkeit des Anbieters oder seiner Erfüllungsgehilfen.

§ 8 Laufzeit und Kündigung
Der Vertrag hat eine Mindestlaufzeit von zwölf (12) Monaten ab Vertragsschluss. Nach Ablauf der Mindestlaufzeit verlängert sich der Vertrag automatisch um weitere zwölf (12) Monate, sofern er nicht mit einer Frist von neunzig (90) Tagen vor Ablauf der jeweiligen Laufzeit in Textform gekündigt wird.

§ 9 Datenexport und Vertragsende
Bei Vertragsende stellt der Anbieter dem Kunden auf gesonderte schriftliche Anfrage hin die Kundendaten einmalig im CSV-Format zur Verfügung. Der Datenexport muss innerhalb von dreißig (30) Tagen nach Vertragsende beantragt werden. Nach Ablauf dieser Frist werden sämtliche Kundendaten unwiderruflich und ohne Möglichkeit der Wiederherstellung gelöscht.

§ 10 Anwendbares Recht und Gerichtsstand
Dieser Vertrag unterliegt ausschließlich dem Recht des Staates Delaware, Vereinigte Staaten von Amerika. Ausschließlicher Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesem Vertrag ist Wilmington, Delaware, USA. Die Anwendung des UN-Kaufrechts (CISG) ist ausgeschlossen. Die Parteien vereinbaren, dass Gerichtsverfahren ausschließlich in englischer Sprache geführt werden.

Zürich / Hamburg, 1. März 2024

DERMALOG Identification Systems GmbH          CloudStack Technologies AG
___________________________                   ___________________________`
  },
  {
    id: "cronus-demo-003",
    bcId: "VLC-2023-089",
    title: "Rahmenvertrag — Industrieservice Partners GmbH",
    vendor: "Industrieservice Partners GmbH",
    contractType: "Rahmenvertrag",
    amount: 240000,
    currency: "EUR",
    startDate: "2023-07-01",
    endDate: null as unknown as string,
    riskHint: "hoch",
    riskDescription: "Haftungsausschluss grobe Fahrlässigkeit (§309 Nr. 7b BGB) + absolutes Aufrechnungsverbot",
    text: `RAHMENVERTRAG ÜBER INDUSTRIELLE DIENSTLEISTUNGEN

zwischen

DERMALOG Identification Systems GmbH
Bredowstraße 19, 22113 Hamburg
(nachfolgend „Auftraggeber")

und

Industrieservice Partners GmbH
Ruhrstraße 88, 45472 Mülheim an der Ruhr
(nachfolgend „Auftragnehmer")

§ 1 Vertragsgegenstand
Der Auftragnehmer erbringt für den Auftraggeber auf Abruf technische Wartungs-, Reparatur- und Installationsleistungen an Maschinen, Anlagen und Geräten des Auftraggebers. Einzelaufträge werden schriftlich oder per E-Mail erteilt. Das geplante Jahresvolumen beträgt ca. EUR 240.000,00 netto.

§ 2 Vergütung und Preisanpassung
Die Vergütung richtet sich nach den jeweils zum Zeitpunkt der Auftragserteilung gültigen Stunden- und Materialsätzen des Auftragnehmers. Der Auftragnehmer ist berechtigt, seine Vergütungssätze mit einer Ankündigungsfrist von zwei (2) Wochen einseitig anzupassen. Angepasste Sätze gelten für alle zum Zeitpunkt der Anpassung noch nicht abgeschlossenen Aufträge.

§ 3 Haftung des Auftragnehmers
3.1 Der Auftragnehmer haftet für durch ihn oder seine Erfüllungsgehilfen schuldhaft verursachte Schäden ausschließlich im Fall von Vorsatz.
3.2 Jegliche Haftung des Auftragnehmers für fahrlässig — auch grob fahrlässig — verursachte Schäden am Eigentum, Vermögen oder Daten des Auftraggebers ist vollständig und endgültig ausgeschlossen.
3.3 Die Haftung des Auftragnehmers für Körperschäden und Personenschäden ist auf EUR 50.000,00 je Schadensfall begrenzt.
3.4 Haftungsansprüche wegen Datenverlust sind auf den Wiederherstellungsaufwand beschränkt, der bei ordnungsgemäßer Datensicherung durch den Auftraggeber angefallen wäre.
3.5 Der Auftraggeber stellt den Auftragnehmer von sämtlichen Ansprüchen Dritter frei, die auf einer fehlerhaften oder unsachgemäßen Bedienung von Anlagen durch den Auftraggeber beruhen.

§ 4 Aufrechnung und Zurückbehaltungsrecht
4.1 Dem Auftraggeber ist die Aufrechnung mit eigenen Forderungen gegenüber Vergütungsansprüchen des Auftragnehmers in jedem Fall und unabhängig vom Entstehungsgrund der Gegenforderung untersagt.
4.2 Ein Zurückbehaltungsrecht des Auftraggebers gegenüber fälligen Zahlungsansprüchen des Auftragnehmers ist vollständig ausgeschlossen, unabhängig davon, ob die Gegenforderung bestritten oder unbestritten, fällig oder nicht fällig ist.
4.3 Vorstehende Regelungen gelten auch dann, wenn der Auftraggeber Mängel an erbrachten Leistungen des Auftragnehmers geltend macht.

§ 5 Gewährleistung und Rügefristen
5.1 Mängel an erbrachten Leistungen sind innerhalb von vierzehn (14) Tagen nach ihrer Feststellung schriftlich beim Auftragnehmer zu rügen. Verspätete Rügen führen zum vollständigen Erlöschen aller Gewährleistungsansprüche.
5.2 Die Gewährleistungsfrist beträgt sechs (6) Monate ab Abnahme der jeweiligen Leistung.
5.3 Als Gewährleistung steht dem Auftragnehmer ausschließlich das Recht zur Nacherfüllung zu. Ansprüche auf Minderung, Rücktritt oder Schadensersatz sind ausgeschlossen, soweit gesetzlich zulässig.

§ 6 Einsatz von Subunternehmern
Der Auftragnehmer ist berechtigt, zur Erbringung der Leistungen Subunternehmer einzusetzen, ohne den Auftraggeber hierüber zu informieren oder dessen vorherige Zustimmung einzuholen. Der Auftraggeber haftet gegenüber Subunternehmern des Auftragnehmers nicht.

§ 7 Vertragsdauer und Kündigung
Dieser Rahmenvertrag wird auf unbestimmte Zeit geschlossen. Er kann von jeder Partei mit einer Frist von sechs (6) Monaten zum Monatsende schriftlich gekündigt werden. Das Recht zur außerordentlichen Kündigung bleibt unberührt.

§ 8 Datenschutz
Im Rahmen der Vertragsausführung werden möglicherweise personenbezogene Daten von Mitarbeitern und Dritten verarbeitet. Entsprechende datenschutzrechtliche Regelungen werden bei konkretem Bedarf zwischen den Parteien separat getroffen.

§ 9 Schlussbestimmungen
Gerichtsstand ist Mülheim an der Ruhr. Es gilt deutsches Recht. Änderungen und Ergänzungen dieses Vertrages bedürfen der Schriftform. Mündliche Nebenabreden bestehen nicht.

Mülheim an der Ruhr / Hamburg, 1. Juli 2023

DERMALOG Identification Systems GmbH          Industrieservice Partners GmbH
___________________________                   ___________________________`
  }
]
