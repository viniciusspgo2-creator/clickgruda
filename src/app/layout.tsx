import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "@/components/site/studio-home.css";
import { Toaster } from "@/components/ui/toaster";
import { PageTracker } from "@/components/site/page-tracker";
import { getSeoConfig } from "@/lib/site-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoConfig();
  const base = seo.siteUrl || "https://clicktools.vercel.app";

  return {
    metadataBase: new URL(base),
    title: {
      default: seo.defaultTitle,
      template: seo.titleTemplate.includes("%s") ? seo.titleTemplate : `%s | ${seo.siteName}`,
    },
    description: seo.description,
    keywords: seo.keywords,
    authors: [{ name: seo.siteName }],
    creator: seo.siteName,
    openGraph: {
      title: seo.defaultTitle,
      description: seo.description,
      type: "website",
      siteName: seo.siteName,
      locale: "pt_BR",
      images: [{ url: seo.ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      creator: seo.twitterCreator || undefined,
    },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = {
  themeColor: "#0a0908",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const seo = await getSeoConfig();
  const base = (seo.siteUrl || "https://clicktools.vercel.app").replace(/\/+$/, "");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        name: seo.siteName,
        url: base,
        description: seo.description,
        inLanguage: "pt-BR",
        publisher: { "@id": `${base}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: seo.siteName,
        alternateName: "Click e Gruda",
        url: base,
        description:
          "Studio Mockup 3D para canecas, incluso para assinantes da Biblioteca de Artes Click & Gruda. Acesso avulso de 24 horas e cinco ferramentas bônus gratuitas.",
        logo: { "@type": "ImageObject", url: `${base}${seo.ogImage}` },
        sameAs: [
          "https://www.clickgruda.com.br/",
          "https://www.instagram.com/clickgruda.digital",
          "https://wa.me/62998387816",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          telephone: "+55-62-99838-7816",
          url: "https://wa.me/62998387816",
          availableLanguage: ["Portuguese"],
        },
        areaServed: { "@type": "Country", name: "Brasil" },
      },
    ],
  };

  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${display.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <PageTracker />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {seo.gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${seo.gaId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${seo.gaId}');`,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}
