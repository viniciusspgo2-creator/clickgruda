import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { GeoSchema } from "@/components/geo/GeoSchema";
import { AnalyticsScripts } from "@/components/geo/AnalyticsScripts";
import { SITE, SITE_URL, CONTENT_PUBLISHED_ISO, todayISO } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Click & Gruda — Artes Prontas para Sublimação de Canecas | Acesso Vitalício",
    template: "%s | Click & Gruda",
  },
  description:
    "Acesso vitalício às artes prontas para sublimação de canecas, no formato 21×9,5 cm em alta resolução. Lançamentos frequentes, pagamento único de R$ 47,90 — sem mensalidade, downloads ilimitados para produzir e vender as suas canecas.",
  keywords: [
    "artes para canecas",
    "sublimação de canecas",
    "artes para sublimação",
    "arte sublimação caneca 21x9,5",
    "sublimação",
    "sublimadores",
    "flork",
    "artes digitais para canecas",
    "acesso vitalício artes",
    "artes sazonais canecas",
    "Click e Gruda",
  ],
  authors: [{ name: SITE.author.name, url: SITE_URL }],
  creator: SITE.author.name,
  publisher: SITE.name,
  category: "e-commerce",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
  openGraph: {
    title: "Click & Gruda — Artes Prontas para Canecas | Acesso Vitalício por R$ 47,90",
    description:
      "Todas as artes liberadas por R$ 47,90. Pagamento único, sem mensalidade, downloads ilimitados, formato 21×9,5 cm e lançamentos frequentes inclusos.",
    siteName: SITE.name,
    locale: "pt_BR",
    type: "website",
    url: SITE_URL,
    images: [
      {
        url: "/uploads/hero-mug.png",
        width: 1344,
        height: 768,
        alt: "Canecas sublimadas com artes digitais da Click & Gruda",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Click & Gruda — Artes Prontas para Sublimação de Canecas",
    description:
      "Acesso vitalício: todas as artes + lançamentos por R$ 47,90 únicos. Formato 21×9,5 cm, download ilimitado para produzir e vender as suas canecas.",
    images: ["/uploads/hero-mug.png"],
  },
  other: {
    "article:published_time": CONTENT_PUBLISHED_ISO,
    "article:modified_time": todayISO(),
    // SEO local — operação 100% digital, área atendida Brasil
    "geo.region": "BR",
    "geo.placename": "Brasil",
  },
  // Google Search Console: defina NEXT_PUBLIC_GSC_VERIFICATION no ambiente
  ...(process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {/* Grafo JSON-LD completo — server-rendered, legível por crawlers sem JS */}
        <GeoSchema />
        {/* GA4 + GTM: carregam SOMENTE quando configurados via env (zero overhead) */}
        <AnalyticsScripts />
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
