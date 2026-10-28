/* ============================================================
   Configuração do site (SEO) — persistida em SiteConfig
   ============================================================ */

import { db } from "@/lib/db";

export interface SeoConfig {
  siteName: string;
  defaultTitle: string;
  titleTemplate: string; // ex.: "%s | Click & Gruda Tools"
  description: string;
  keywords: string[];
  siteUrl: string;
  ogImage: string;
  twitterCreator: string;
  gaId: string; // Google Analytics (vazio = desligado)
}

export const DEFAULT_SEO: SeoConfig = {
  siteName: "Click Gruda Studio 3D",
  defaultTitle: "Click Gruda — Studio Mockup 3D",
  titleTemplate: "%s | Click & Gruda Tools",
  description:
    "Studio Mockup 3D para canecas: gratuito para assinantes da Biblioteca de Artes Click & Gruda (R$ 47,90, acesso vitalício) ou acesso avulso por R$ 12,90 durante 24 horas. Cinco ferramentas bônus gratuitas.",
  keywords: [
    "ferramentas online grátis",
    "gerador de QR Code",
    "link personalizado WhatsApp",
    "gerador de orçamento",
    "gerador de contrato",
    "editor de PDF",
    "conversor de imagens",
    "mockup 3D canecas",
    "sublimação de canecas",
    "Click e Gruda",
  ],
  siteUrl: "https://clicktools.vercel.app",
  ogImage: "/og/og-default.png",
  twitterCreator: "",
  gaId: "",
};

const SEO_KEY = "seo";

export async function getSeoConfig(): Promise<SeoConfig> {
  try {
    const row = await db.siteConfig.findUnique({ where: { key: SEO_KEY } });
    if (row) {
      const parsed = JSON.parse(row.value) as Partial<SeoConfig>;
      const result = { ...DEFAULT_SEO, ...parsed };
      // A configuração salva de versões anteriores pode manter a oferta anual.
      if (/R\$\s*34,90\s*(?:por|\/)\s*ano/i.test(result.description)) {
        result.description = DEFAULT_SEO.description;
      }
      return result;
    }
  } catch {
    /* banco indisponível → defaults */
  }
  return DEFAULT_SEO;
}

export async function saveSeoConfig(
  partial: Partial<SeoConfig>,
): Promise<SeoConfig> {
  const current = await getSeoConfig();
  const next: SeoConfig = {
    ...current,
    ...partial,
    keywords: Array.isArray(partial.keywords)
      ? partial.keywords
      : current.keywords,
  };
  await db.siteConfig.upsert({
    where: { key: SEO_KEY },
    update: { value: JSON.stringify(next) },
    create: { key: SEO_KEY, value: JSON.stringify(next) },
  });
  return next;
}
