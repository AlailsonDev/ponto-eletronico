import type { Config } from "tailwindcss";

// Tokens de design do sistema de ponto eletrônico.
// Paleta institucional: navy profundo + teal para estados "ativos".
// Evitamos os defaults genéricos de IA (cream/terracota, dark/neon).
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0E1526",
          900: "#161F35",
          800: "#1B2A4A",
          700: "#243761",
          600: "#2F4578",
        },
        teal: {
          600: "#0E7C86",
          500: "#12939F",
          100: "#DFF3F4",
        },
        amber: {
          600: "#C2410C",
          100: "#FDEBD9",
        },
        green: {
          600: "#15803D",
          100: "#DDF3E4",
        },
        red: {
          600: "#B91C1C",
          100: "#FBE1E1",
        },
        surface: {
          DEFAULT: "#F7F8FA",
          card: "#FFFFFF",
          border: "#E4E7EC",
        },
        ink: {
          900: "#1A1F2B",
          600: "#4A5266",
          400: "#8A93A6",
        },
      },
      fontFamily: {
        display: ["var(--font-sora)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20, 26, 43, 0.04), 0 1px 6px rgba(20, 26, 43, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
