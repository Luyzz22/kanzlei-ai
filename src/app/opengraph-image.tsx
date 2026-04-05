import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "KanzleiAI — KI-Vertragsanalyse"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #FAFAF7 0%, #F0E6CC 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "#003856",
            marginBottom: 32,
          }}
        >
          <span style={{ color: "white", fontSize: 28, fontWeight: 700 }}>KA</span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#111110",
            letterSpacing: "-0.02em",
            marginBottom: 16,
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          KanzleiAI
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 24,
            color: "#78756D",
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          KI-Vertragsanalyse fuer juristische Teams im DACH-Markt
        </p>

        {/* Features */}
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 40,
          }}
        >
          {["Claude Sonnet 4", "Risiko-Score", "DATEV Export", "DSGVO-konform"].map((f) => (
            <div
              key={f}
              style={{
                background: "white",
                border: "1px solid #E8E6E1",
                borderRadius: 12,
                padding: "10px 20px",
                fontSize: 16,
                color: "#3D3B37",
                fontWeight: 500,
              }}
            >
              {f}
            </div>
          ))}
        </div>

        {/* Brand */}
        <p
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 14,
            color: "#A09D95",
          }}
        >
          www.kanzlei-ai.com · SBS Deutschland GmbH & Co. KG
        </p>
      </div>
    ),
    { ...size }
  )
}
