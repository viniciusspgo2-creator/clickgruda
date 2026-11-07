'use client'

import { useQuery } from '@tanstack/react-query'

/** Landing e cadastro apresentam a mesma oferta publicada pelo servidor. */
export function useFreeSignup() {
  const { data } = useQuery({
    queryKey: ['auth-options'],
    queryFn: async () => {
      const response = await fetch('/api/auth/options', { cache: 'no-store' })
      if (!response.ok) throw new Error('Oferta indisponível')
      return response.json() as Promise<{ freeSignup: boolean }>
    },
    staleTime: 60_000,
  })
  return data?.freeSignup === true
}
