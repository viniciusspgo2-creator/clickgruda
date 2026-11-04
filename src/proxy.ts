import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  if (request.nextUrl.searchParams.has('catalogo')) {
    return new NextResponse('<!doctype html><html lang="pt-BR"><head><title>Catálogo descontinuado | Click &amp; Gruda</title><meta name="robots" content="noindex,nofollow"></head><body><h1>Este catálogo foi descontinuado</h1><p>O compartilhamento de catálogo foi removido.</p><a href="/">Visitar a Click &amp; Gruda</a></body></html>', {
      status: 410, headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' },
    })
  }
  const response = NextResponse.next()
  if (request.nextUrl.searchParams.has('arte')) response.headers.set('X-Robots-Tag', 'noindex, follow')
  return response
}
export const config = { matcher: ['/'] }
