'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Coffee, Heart, Loader2, Lock, Mail, Sparkles, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/shared/Logo'
import { Marquee } from '@/components/shared/Marquee'
import { useStore } from '@/lib/store'
import { track } from '@/lib/analytics'

export function AuthView() {
  const user = useStore((s) => s.user)
  const setUser = useStore((s) => s.setUser)
  const setView = useStore((s) => s.setView)
  const authMode = useStore((s) => s.authMode)
  const setAuthMode = useStore((s) => s.setAuthMode)
  const pendingIntent = useStore((s) => s.pendingIntent)
  const setPendingIntent = useStore((s) => s.setPendingIntent)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.hasAccess) setView('portal')
  }, [user, setView])

  const routeAfterAuth = (u: { hasAccess: boolean } | null | undefined) => {
    if (pendingIntent === 'checkout') {
      setPendingIntent(null)
      setView('checkout')
      return
    }
    setView(u?.hasAccess ? 'portal' : 'checkout')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(authMode === 'login' ? '/api/auth/login' : '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Algo deu errado. Tente novamente.')
        return
      }
      track('auth_submit', { method: authMode, success: true })
      setUser(data.user)
      routeAfterAuth(data.user)
    } catch {
      setError('Falha de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* ---------- Left brand panel ---------- */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-zinc-950 p-10 text-white lg:flex">
        <div className="bg-grid-dark absolute inset-0" aria-hidden />
        <div className="absolute -left-20 top-1/3 h-80 w-80 rounded-full bg-orange-600/25 blur-[120px]" aria-hidden />

        <div className="relative">
          <Logo dark />
        </div>

        <div className="relative max-w-md">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-xl shadow-orange-600/30">
            <Coffee className="h-7 w-7 text-white" fill="white" />
          </div>
          <h2 className="text-4xl font-black leading-tight tracking-tight">
            Todas as artes. <br />
            <span className="text-gradient-orange">Um único pagamento.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            Entre no portal e baixe as artes no formato 21×9,5 cm — com lançamentos frequentes, aba sazonal e
            favoritos em um só lugar.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm font-medium text-zinc-300">
            {['Download ilimitado pra sempre', 'Use nas canecas que você vende', 'PIX automático libera na hora'].map((i) => (
              <li key={i} className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/20">
                  <Check className="h-3 w-3 text-orange-400" />
                </span>
                {i}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative" aria-hidden>
          <Marquee
            items={['FLORK', 'PROFISSÕES', 'RELIGIÃO', 'FRASES', 'ANIMAIS', 'COMEMORATIVAS']}
            duration={26}
            className="rounded-xl border border-zinc-800 bg-zinc-900/70 py-2.5"
            itemClassName="text-xs font-black uppercase tracking-[0.2em] text-zinc-400"
          />
        </div>
      </div>

      {/* ---------- Form panel ---------- */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Logo />
          </div>

          <button
            onClick={() => setView('landing')}
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-400 transition-colors hover:text-orange-600"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para o site
          </button>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-xl shadow-zinc-200/50 sm:p-8"
          >
            {/* mode switch */}
            <div className="relative mb-7 grid grid-cols-2 rounded-2xl bg-zinc-100 p-1">
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setAuthMode(m)
                    setError(null)
                  }}
                  className={`relative z-10 rounded-xl py-2.5 text-sm font-bold transition-colors ${
                    authMode === m ? 'text-zinc-950' : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  {authMode === m && (
                    <motion.span
                      layoutId="auth-pill"
                      className="absolute inset-0 -z-10 rounded-xl bg-white shadow-md"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  {m === 'login' ? 'Já sou cliente' : 'Criar conta'}
                </button>
              ))}
            </div>

            <h1 className="text-2xl font-black tracking-tight text-zinc-950">
              {authMode === 'login' ? 'Bem-vindo de volta!' : 'Vamos desbloquear suas artes!'}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {authMode === 'login'
                ? 'Entre para acessar o portal de downloads.'
                : 'Crie sua conta em 30 segundos e escolha seu pagamento.'}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {authMode === 'register' && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                    Seu nome
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Maria Sublimadora"
                      className="h-11 rounded-xl border-zinc-200 pl-9 text-[15px] focus-visible:ring-orange-500"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    className="h-11 rounded-xl border-zinc-200 pl-9 text-[15px] focus-visible:ring-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 rounded-xl border-zinc-200 pl-9 text-[15px] focus-visible:ring-orange-500"
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-600"
                  role="alert"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-[15px] font-black text-white shadow-lg shadow-orange-500/30 hover:brightness-105"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" /> Aguarde...
                  </>
                ) : authMode === 'login' ? (
                  <>
                    Entrar no portal <ArrowRight className="ml-1.5 h-4.5 w-4.5" />
                  </>
                ) : (
                  <>
                    Criar conta <Sparkles className="ml-1.5 h-4.5 w-4.5" />
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
