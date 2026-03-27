import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        sbs: {
          blue: {
            DEFAULT: "#003856",
            dark: "#002a42",
            light: "#00507a",
            50: "#e8f4fa",
            100: "#c5e2f0",
            200: "#8ec5e0",
            300: "#5aa8cc",
            400: "#2d8bb8",
            500: "#006e9f",
            600: "#003856",
            700: "#002a42",
            800: "#001e30",
            900: "#00131f"
          },
          yellow: "#FFB900"
        }
      },
      fontFamily: {
        sans: [
          "-apple-system", "BlinkMacSystemFont", "SF Pro Display",
          "Inter", "Segoe UI", "system-ui", "sans-serif"
        ]
      },
      fontSize: {
        "display-lg": ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.025em", fontWeight: "600" }],
        "display": ["2.75rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "600" }],
        "display-sm": ["2rem", { lineHeight: "1.2", letterSpacing: "-0.015em", fontWeight: "600" }],
      },
      boxShadow: {
        "soft": "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "card": "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        "elevated": "0 4px 16px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
        "header": "0 1px 0 0 rgb(0 0 0 / 0.06)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
      }
    }
  },
  plugins: []
}

export default config
