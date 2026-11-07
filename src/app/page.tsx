import type { Metadata } from 'next'
import { AppShell } from '@/components/AppShell'
import { HomeSchema } from '@/components/geo/HomeSchema'
import { getPublicMarketing } from '@/lib/public-marketing'
import { SITE, SITE_URL, SOCIAL_IMAGE } from '@/lib/site'

export const metadata: Metadata = {
  title: { absolute: 'Click & Gruda — Biblioteca de Artes para Canecas | Teste grátis' },
  description: SITE.description,
  openGraph: { title: 'Biblioteca Click & Gruda — comece grátis', description: SITE.description, url: SITE_URL, siteName: SITE.name, type: 'website', images: [`${SITE_URL}${SOCIAL_IMAGE}`] },
  twitter: { card: 'summary_large_image', title: 'Biblioteca Click & Gruda — comece grátis', description: SITE.description, images: [`${SITE_URL}${SOCIAL_IMAGE}`] },
  alternates: { canonical: `${SITE_URL}/` },
}

export default async function Home() {
  const { priceCents } = await getPublicMarketing()
  return <><HomeSchema priceCents={priceCents} /><AppShell /></>
}
