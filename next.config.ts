import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,

  /* Imagens remotas: artes podem vir de CDN externa (Cloudflare R2, etc.
     configurada no Admin Master) — libera https genérico para o <Image>. */
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },

  /* ---------- SEO: 301 redirects (aliases futuros e legados) ---------- */
  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
      { source: "/inicio", destination: "/", permanent: true },
      { source: "/posts", destination: "/blog", permanent: true },
      { source: "/artigos", destination: "/blog", permanent: true },
      { source: "/guia", destination: "/blog/artes-para-sublimacao-de-canecas-guia", permanent: true },
      { source: "/como-sublimar", destination: "/blog/como-sublimar-canecas-passo-a-passo", permanent: true },
      { source: "/quem-somos", destination: "/sobre", permanent: true },
    ];
  },

  /* ---------- Segurança + cache (Core Web Vitals) ---------- */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      {
        /* Insumos estáticos: cache longo + stale-while-revalidate (LCP/rendimento) */
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        /* Recursos para IA: cache estável */
        source: "/llms(-full)?.txt",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
