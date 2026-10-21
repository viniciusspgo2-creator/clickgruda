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
    default: "Click & Gruda — Biblioteca de Artes, Mockups 3D e Catálogo Online",
    template: "%s | Click & Gruda",
  },
  description:
    "Plataforma de artes para sublimação com biblioteca organizada, categorias, datas especiais, atualizações semanais, gerador de mockups 3D e loja online para assinantes. Conheça as condições de acesso.",
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
    title: "Click & Gruda — Artes Prontas, Mockups 3D e Loja Online",
    description:
      "Biblioteca organizada com curadoria, atualizações semanais, mockups 3D e loja online para assinantes. Veja a oferta e os recursos da plataforma.",
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
      "Biblioteca de artes com curadoria, atualizações semanais, mockups 3D e loja online para assinantes. Confira a oferta atual.",
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
  themeColor: "#14171e",
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
