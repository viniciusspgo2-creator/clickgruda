import type { Metadata } from 'next'
import { Ds24Thanks } from '@/components/digistore24/Ds24Thanks'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Obrigado pela sua compra — Click & Gruda',
  description:
    'A sua compra foi processada pela Digistore24. O acesso por 2 anos à Click & Gruda é libertado automaticamente na conta com o mesmo e-mail da compra.',
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_URL}/digistore24/obrigado` },
}

export default function Page() {
  return <Ds24Thanks />
}
