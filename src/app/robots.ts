import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Uma única regra compartilhada: grupos específicos não herdam o grupo '*'.
// CSS, JS, imagens e o conhecimento público permanecem rastreáveis.
const disallow = [
  '/admin', '/portal', '/checkout', '/login', '/cadastro',
  '/api/admin/', '/api/auth/', '/api/payments/', '/api/portal/',
  '/api/favorites', '/api/analytics/', '/api/public/catalog/',
  '/api/arts/', '/api/enhance-requests',
  '/*?catalogo=', '/*&catalogo=', '/*?arte=', '/*&arte=',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: ['*', 'Googlebot', 'Bingbot', 'OAI-SearchBot', 'ChatGPT-User',
        'GPTBot', 'PerplexityBot', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot',
        'Google-Extended', 'CCBot', 'Applebot', 'Applebot-Extended',
        'meta-externalagent', 'Bytespider', 'Amazonbot'],
      allow: '/',
      disallow,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
