import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { GeoSchema } from "@/components/geo/GeoSchema";
import { AnalyticsScripts } from "@/components/geo/AnalyticsScripts";
import { SITE, SITE_URL, SOCIAL_IMAGE } from "@/lib/site";

import { getPublicMarketing } from '@/lib/public-marketing';

export const revalidate = 300;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { config } = await getPublicMarketing();
  return {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Click&Gruda — Biblioteca de Artes para Canecas | Artes Selecionadas",
    template: "%s | Click & Gruda",
  },
  description:
    "Artes para sublimação de canecas organizadas por tema, com downloads ilimitados, novidades semanais e mockup 3D. Conheça a Click & Gruda.",
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
    title: "Click&Gruda — Biblioteca de Artes para Sublimação de Canecas",
    description:
      "Mais de 8 mil artes para canecas organizadas por tema. Downloads ilimitados, novidades semanais e mockups 3D para quem vive de personalizados.",
    siteName: SITE.name,
    locale: "pt_BR",
    type: "website",
    url: SITE_URL,
    images: [
      {
        url: SOCIAL_IMAGE,
        width: 1122,
        height: 1402,
        alt: "Canecas sublimadas com artes digitais da Click & Gruda",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Click & Gruda — Artes Prontas para Sublimação de Canecas",
    description:
      "Mais de 8 mil artes para canecas com curadoria, atualizações semanais, downloads ilimitados e mockups 3D. Confira a oferta atual.",
    images: [SOCIAL_IMAGE],
  },
  verification: {
    ...(config.gscVerification ? { google: config.gscVerification } : {}),
    other: {
      ...(config.bingVerification ? { 'msvalidate.01': config.bingVerification } : {}),
      ...(config.metaDomainVerification ? { 'facebook-domain-verification': config.metaDomainVerification } : {}),
    },
  },
  };
}

export const viewport: Viewport = {
  themeColor: "#14171e",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { config } = await getPublicMarketing();
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {/* Entidades da marca no HTML; schemas de conteúdo ficam em cada página. */}
        <GeoSchema socialUrls={config.socialUrls} />
        {/* IDs do Admin Master ou ambiente; scripts opcionais após consentimento. */}
        <AnalyticsScripts config={config} />
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
