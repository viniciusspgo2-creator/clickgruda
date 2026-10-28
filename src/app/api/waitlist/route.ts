/** Oferta retirada desta plataforma. Preserva os registros históricos no banco. */
export async function POST() {
  return Response.json({ error: 'Esta oferta não está disponível nesta plataforma.' }, { status: 410 })
}
