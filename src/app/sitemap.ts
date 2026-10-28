import type { MetadataRoute } from "next";
import { getSeoConfig } from "@/lib/site-config";
import { BONUS_TOOLS } from "@/lib/studio-links";
import { ALL_ARTICLES } from "@/data/blog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await getSeoConfig();
  const base = (seo.siteUrl || "https://clickgruda.vercel.app").replace(
    /\/+$/,
    "",
  );

  const statics: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.9 },
    {
      url: `${base}/mockup-caneca-3d`,
      changeFrequency: "monthly",
      priority: 0.95,
    },
  ];

  const posts: MetadataRoute.Sitemap = ALL_ARTICLES.map((a) => ({
    url: `${base}/blog/${a.slug}`,
    lastModified: new Date(`${a.date}T12:00:00-03:00`),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    ...statics,
    { url: `${base}/bonus`, priority: 0.5 },
    ...BONUS_TOOLS.map((t) => ({
      url: `${base}/bonus/${t.id}`,
      priority: 0.4,
    })),
    ...posts,
  ];
}
