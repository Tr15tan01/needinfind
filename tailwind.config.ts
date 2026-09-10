import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

// Small helper so each token definition stays a one-liner below, per
// Tailwind's documented pattern for opacity-aware CSS-variable colors:
// rgb(var(--x) / <alpha-value>) lets `bg-ink-900/50` etc. still work.
const v = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Design system: "advisor, not aisle" — deep ink navy for authority,
        // warm parchment for a paper/notebook read, muted teal for trust cues,
        // gold reserved only for the single primary action per screen.
        //
        // Every value here reads from a CSS variable (defined in
        // globals.css, with light values under :root and dark values
        // under .dark) rather than a literal hex — that's the entire dark
        // mode mechanism. Toggling the `dark` class on <html> re-themes
        // every existing bg-ink-900 / text-parchment / etc. across the
        // whole app automatically.
        ink: {
          DEFAULT: v("--color-ink-900"),
          50: v("--color-ink-50"),
          100: v("--color-ink-100"),
          300: v("--color-ink-300"),
          500: v("--color-ink-500"),
          700: v("--color-ink-700"),
          900: v("--color-ink-900")
        },
        parchment: {
          DEFAULT: v("--color-parchment"),
          100: v("--color-parchment"),
          200: v("--color-parchment-200")
        },
        // Card/panel background — was literal bg-white everywhere; now a
        // token so cards flip to a dark surface in dark mode too.
        surface: v("--color-surface"),
        trust: {
          DEFAULT: v("--color-trust-500"),
          100: v("--color-trust-100"),
          500: v("--color-trust-500"),
          700: v("--color-trust-700")
        },
        gold: {
          DEFAULT: v("--color-gold-500"),
          100: v("--color-gold-100"),
          500: v("--color-gold-500"),
          700: v("--color-gold-700")
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"]
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        lg: "16px",
        xl: "22px"
      },
      boxShadow: {
        soft: "0 2px 10px rgb(var(--color-ink-900) / 0.06)",
        lifted: "0 12px 40px rgb(var(--color-ink-900) / 0.12)"
      }
    }
  },
  plugins: [typography]
};

export default config;
