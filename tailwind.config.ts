import type { Config } from "tailwindcss";

// Brand colour scales from the PFM NEXT logo. Each scale reads its hue and saturation from CSS
// variables (--brand-<name>-h / -s in globals.css), so a rebrand only edits those variables.
// Step 500 is the exact logo colour; the other steps fix the lightness.
const LIGHTNESS = { 50: "97%", 100: "93%", 200: "85%", 300: "68%", 400: "40%", 600: "38%", 700: "32%", 800: "26%", 900: "20%" } as const
function brandScale(name: string) {
  const color = (lightness: string) => `hsl(var(--brand-${name}-h) var(--brand-${name}-s) ${lightness} / <alpha-value>)`
  return {
    ...Object.fromEntries(Object.entries(LIGHTNESS).map(([step, lightness]) => [step, color(lightness)])),
    500: color(`var(--brand-${name}-l)`),
    DEFAULT: color(`var(--brand-${name}-l)`),
  }
}

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      colors: {
        // Logo colours by name, and the Tailwind palettes the UI already uses remapped onto them:
        // sky (accents, buttons, links) → blue, emerald (success) → green, red (errors) → red,
        // amber (warnings) → orange.
        brand: { blue: brandScale("blue"), green: brandScale("green"), red: brandScale("red"), orange: brandScale("orange"), ink: "hsl(var(--brand-ink) / <alpha-value>)" },
        sky: brandScale("blue"),
        emerald: brandScale("green"),
        red: brandScale("red"),
        amber: brandScale("orange"),
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
