import { WHATSAPP } from '@/lib/site'

/**
 * Conteúdo da caixa de novidades do portal — edite aqui, sem mexer no layout.
 * Valores em reais (cobrança ANUAL).
 */
export const CATALOGO_DIGITAL = {
  name: 'Catálogo Digital',
  /** valor para quem ainda não é membro */
  publicPrice: 197,
  /** valor exclusivo para quem já está no portal */
  memberPrice: 78,
  headline: 'Chegando: o seu Catálogo Digital',
  description:
    'Uma vitrine online só sua para divulgar os seus produtos personalizados — canecas e muito mais — de um jeito profissional, bonito e fácil de compartilhar com os seus clientes.',
  highlights: [
    'Vitrine digital para divulgar os seus produtos personalizados',
    'Visual profissional que valoriza o seu trabalho',
    'Preço exclusivo de membro, garantido para quem já está aqui',
  ],
  /** mensagem do WhatsApp para entrar na lista de espera com o preço de membro */
  whatsappText: 'Olá! Sou membro da Click & Gruda e quero garantir o preço de membro do Catálogo Digital (R$ 78/ano).',
} as const

export const brl = (n: number) => `R$ ${n.toFixed(2).replace('.', ',')}`

export const catalogoWhatsappLink = () => WHATSAPP.link(CATALOGO_DIGITAL.whatsappText)
