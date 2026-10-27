import type { Metadata } from 'next'
import { AppShell } from '@/components/AppShell'
import { HomeSchema } from '@/components/geo/HomeSchema'
import { getPublicMarketing } from '@/lib/public-marketing'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = { alternates: { canonical: `${SITE_URL}/` } }

export default async function Home() {
  const { priceCents } = await getPublicMarketing()
  return <><HomeSchema priceCents={priceCents} /><AppShell /></>
}
