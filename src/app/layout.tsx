import type { Metadata } from "next";
import { Sora, Inter, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import { AuthProvider } from "@/hooks/useAuth";
import { AccessibilityWidget } from "@/components/layout/AccessibilityWidget";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["500", "600", "700"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500"],
});
// Audiowide (Google Fonts) servida localmente: o download pelo next/font/google
// falha na rede institucional e cai silenciosamente para Arial.
const audiowide = localFont({
  src: "../assets/fonts/Audiowide-Regular.woff2",
  variable: "--font-audiowide",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CtrlClock",
  description: "Registro de jornada de trabalho — CGM Jaboatão dos Guararapes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${sora.variable} ${inter.variable} ${plexMono.variable} ${audiowide.variable} bg-surface font-body text-ink-900`}>
        <AuthProvider>
          {children}
          <AccessibilityWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
