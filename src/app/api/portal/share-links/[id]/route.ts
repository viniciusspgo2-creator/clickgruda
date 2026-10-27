/** Compartilhamento de catálogo descontinuado. */
function gone() {
  return Response.json({ error: 'O compartilhamento de catálogo foi removido.' }, {
    status: 410, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  })
}
export const DELETE = gone
