'use client'

import { ShieldAlert, MessageCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/store'
import { WHATSAPP } from '@/lib/site'

export function SessionAccessDialog() {
  const notice = useStore(s => s.sessionNotice)
  const limit = useStore(s => s.sessionDeviceLimit)
  const dismiss = () => useStore.getState().setSessionNotice(null)
  const blocked = notice === 'ACCOUNT_BLOCKED'
  return <Dialog open={Boolean(notice)} onOpenChange={open => { if (!open) dismiss() }}>
    <DialogContent className="max-w-lg rounded-3xl bg-white p-6 text-zinc-900 sm:p-8">
      <DialogHeader><div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-700"><ShieldAlert className="h-6 w-6" /></div><DialogTitle className="text-left text-xl font-extrabold">{blocked ? 'Sua conta precisa de atendimento' : notice === 'NEW_LOGIN' ? 'Seu acesso é individual' : 'Sessão encerrada neste dispositivo'}</DialogTitle><DialogDescription className="pt-2 text-left text-sm leading-7 text-zinc-600">{blocked ? 'O acesso desta conta está bloqueado. Fale com a equipe pelo WhatsApp para verificar a situação e receber orientação.' : notice === 'NEW_LOGIN' ? `Havia outra sessão desta conta aberta. Para respeitar o limite de ${limit} dispositivo${limit === 1 ? '' : 's'} por vez, encerramos a sessão anterior e mantivemos este acesso.` : `Esta conta foi acessada em outro aparelho e esta sessão foi encerrada para respeitar o limite de ${limit} dispositivo${limit === 1 ? '' : 's'} por vez.`}</DialogDescription></DialogHeader>
      {!blocked && <><div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm leading-7 text-zinc-700"><strong className="text-zinc-950">O compartilhamento simultâneo da conta sem autorização é expressamente proibido.</strong> A reincidência poderá levar ao bloqueio da conta pela equipe. Você pode trocar de aparelho; o uso simultâneo além do limite exige acesso adicional.</div><p className="text-sm leading-6 text-zinc-600">Precisa usar mais dispositivos ao mesmo tempo? Solicite um <strong className="text-zinc-900">acesso adicional (IP adicional) por R$ 14,90</strong>. A equipe informa as condições e habilita o adicional após confirmar a contratação.</p></>}
      <a href={WHATSAPP.link(blocked ? 'Olá! Minha conta Click & Gruda está bloqueada e preciso de atendimento.' : 'Olá! Quero contratar um acesso simultâneo adicional (IP adicional) de R$ 14,90 para a minha conta Click & Gruda. Podem informar as condições?')} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-center text-sm font-bold text-white hover:bg-emerald-800"><MessageCircle className="h-4 w-4 shrink-0" /> {blocked ? 'Falar com o suporte' : 'Solicitar acesso adicional'}</a>
      <Button type="button" variant="outline" onClick={dismiss} className="h-11 rounded-xl">Entendi</Button>
    </DialogContent>
  </Dialog>
}
