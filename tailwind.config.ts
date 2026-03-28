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
        /* Override Tailwind gray with warm stone tones */
        gray: {
          50:  "#FAF9F6",
          100: "#F5F4F0",
          200: "#E8E6E1",
          300: "#D8D6CF",
          400: "#A09D95",
          500: "#78756D",
          600: "#57554F",
          700: "#3D3B37",
          800: "#2A2926",
          900: "#1C1B19",
          950: "#111110",
        },
        gold: {
          50:  "#FBF7EE",
          100: "#F5EDDA",
          200: "#E8D9B5",
          300: "#D4B978",
          400: "#C8A85A",
          500: "#B8944A",
          600: "#9A7A3C",
          700: "#8B7340",
          800: "#5C4D2D",
          900: "#3D331E",
        },
        sbs: {
          blue: {
            DEFAULT: "#003856",
            dark: "#002a42",
            light: "#00507a",
            50: "#e8f4fa",
            100: "#c5e2f0",
            200: "#8ec5e0",
            600: "#003856",
            700: "#002a42",
            900: "#00131f",
          },
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
