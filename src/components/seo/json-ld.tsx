export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "KanzleiAI",
    "legalName": "SBS Deutschland GmbH & Co. KG",
    "url": "https://www.kanzlei-ai.com",
    "logo": "https://www.kanzlei-ai.com/icon.svg",
    "description": "KI-gestuetzte Vertragsanalyse für juristische Teams im DACH-Markt.",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "In der Dell 19",
      "addressLocality": "Weinheim",
      "postalCode": "69469",
      "addressCountry": "DE"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "ki@sbsdeutschland.de",
      "contactType": "sales"
    }
  }
  // nosemgrep: typescript.react.security.audit.react-dangerously-set-innerhtml.react-dangerously-set-innerhtml
  // Safe: JSON.stringify of a static typed object — no user input, no external data.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}

export function SoftwareJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "KanzleiAI",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "490",
      "highPrice": "1290",
      "priceCurrency": "EUR",
      "offerCount": "3"
    },
    "featureList": ["KI-Vertragsanalyse", "Contract Copilot", "PDF Export", "DATEV Export", "Row-Level Security", "Mandantentrennung"]
  }
  // nosemgrep: typescript.react.security.audit.react-dangerously-set-innerhtml.react-dangerously-set-innerhtml
  // Safe: JSON.stringify of a static typed object — no user input, no external data.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}
