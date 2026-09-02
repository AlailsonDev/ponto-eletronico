import type { Config } from "tailwindcss";

// Tokens de design do sistema de ponto eletrônico.
// Paleta institucional: azul de marca, amarelo de destaque e verde de presença.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#071B4A",
          900: "#0D2B72",
          800: "#1739A6",
          700: "#2850C7",
          600: "#4669D9",
        },
        teal: {
          600: "#087F4E",
          500: "#16A05F",
          100: "#DDF6E8",
        },
        amber: {
          600: "#A96800",
          100: "#FFF1B8",
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
          DEFAULT: "#F5F8FF",
          card: "#FFFFFF",
          border: "#DCE5F5",
        },
        ink: {
          900: "#14213D",
          600: "#52617A",
          400: "#8A98B0",
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
        card: "0 1px 2px rgba(23, 57, 166, 0.04), 0 1px 6px rgba(23, 57, 166, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
