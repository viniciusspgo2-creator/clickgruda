import type { Metadata } from 'next'
import { Ds24Thanks } from '@/components/digistore24/Ds24Thanks'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Obrigado pela sua compra — Click & Gruda',
  description:
    'A sua compra foi processada pela Digistore24. O acesso por 2 anos à Click & Gruda é libertado automaticamente na conta com o mesmo e-mail da compra.',
  // openGraph/twitter/keywords próprios: os globais do layout trazem
  // "acesso vitalício artes" e "downloads ilimitados", banidos na análise GmbH.
  keywords: ['Click & Gruda', 'Digistore24', 'compra confirmada'],
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_URL}/digistore24/obrigado` },
  openGraph: {
    title: 'Obrigado pela sua compra — Click & Gruda',
    description:
      'A sua compra foi processada pela Digistore24. O acesso por 2 anos à Click & Gruda é libertado automaticamente na conta com o mesmo e-mail da compra.',
    siteName: 'Click & Gruda',
    locale: 'pt_PT',
    type: 'website',
    url: `${SITE_URL}/digistore24/obrigado`,
  },
  twitter: {
    card: 'summary_large_image',
    description:
      'A sua compra foi processada pela Digistore24. O acesso por 2 anos à Click & Gruda é libertado automaticamente na conta com o mesmo e-mail da compra.',
  },
}

export default function Page() {
  return <Ds24Thanks />
}
