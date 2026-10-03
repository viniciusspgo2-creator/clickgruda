import { db } from '@/lib/db'

/* ---------------- Mercado Pago ---------------- */

export async function createMercadoPagoPix(opts: {
  token: string
  amountCents: number
  email: string
  name: string
  description: string
}): Promise<{ externalId: string; qrCodePayload: string; qrCodeImage: string }> {
  const res = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.token}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify({
      transaction_amount: Number((opts.amountCents / 100).toFixed(2)),
      description: opts.description,
      payment_method_id: 'pix',
      ...(process.env.NEXT_PUBLIC_SITE_URL
        ? { notification_url: `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '')}/api/payments/webhook/mercadopago` }
        : {}),
      payer: {
        email: opts.email,
        first_name: opts.name?.split(' ')[0] || 'Cliente',
      },
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.message || data?.error || 'Erro ao criar pagamento no Mercado Pago')
  }
  const td = data?.point_of_interaction?.transaction_data
  return {
    externalId: String(data.id),
    qrCodePayload: td?.qr_code || '',
    qrCodeImage: td?.qr_code_base64 ? `data:image/png;base64,${td.qr_code_base64}` : '',
  }
}

export async function checkMercadoPagoPayment(
  token: string,
  externalId: string
): Promise<'APPROVED' | 'PENDING' | 'FAILED' | null> {
  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${externalId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.status === 'approved') return 'APPROVED'
    if (data.status === 'cancelled' || data.status === 'rejected') return 'FAILED'
    return 'PENDING'
  } catch {
    return null
  }
}

/* ---------------- Asaas ---------------- */

function asaasBase(sandbox: boolean) {
  return sandbox ? 'https://api-sandbox.asaas.com' : 'https://api.asaas.com'
}

export async function createAsaasPix(opts: {
  key: string
  sandbox: boolean
  name: string
  email: string
  cpfCnpj: string
  amountCents: number
  description: string
}): Promise<{ externalId: string; qrCodePayload: string; qrCodeImage: string }> {
  const base = asaasBase(opts.sandbox)
  const headers = { access_token: opts.key, 'Content-Type': 'application/json' }

  const custRes = await fetch(`${base}/v3/customers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: opts.name, email: opts.email, cpfCnpj: opts.cpfCnpj }),
  })
  const cust = await custRes.json().catch(() => ({}))
  if (!custRes.ok) {
    throw new Error(cust?.errors?.[0]?.description || 'Erro Asaas: cliente inválido (verifique o CPF)')
  }

  const today = new Date().toISOString().slice(0, 10)
  const payRes = await fetch(`${base}/v3/payments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      customer: cust.id,
      billingType: 'PIX',
      value: Number((opts.amountCents / 100).toFixed(2)),
      dueDate: today,
      description: opts.description,
    }),
  })
  const pay = await payRes.json().catch(() => ({}))
  if (!payRes.ok) {
    throw new Error(pay?.errors?.[0]?.description || 'Erro Asaas: pagamento')
  }

  let qrCodePayload = ''
  let qrCodeImage = ''
  try {
    const qrRes = await fetch(`${base}/v3/payments/${pay.id}/pixQrCode`, { headers: { access_token: opts.key } })
    const qr = await qrRes.json()
    qrCodePayload = qr.payload || ''
    qrCodeImage = qr.encodedImage ? `data:image/png;base64,${qr.encodedImage}` : ''
  } catch {
    /* QR opcional — payload copy-paste ainda pode existir */
  }

  return { externalId: String(pay.id), qrCodePayload, qrCodeImage }
}

export async function checkAsaasPayment(
  key: string,
  sandbox: boolean,
  externalId: string
): Promise<'APPROVED' | 'PENDING' | 'EXPIRED' | 'FAILED' | null> {
  try {
    const res = await fetch(`${asaasBase(sandbox)}/v3/payments/${externalId}`, {
      headers: { access_token: key },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (['RECEIVED', 'RECEIVED_IN_CASH', 'CONFIRMED'].includes(data.status)) return 'APPROVED'
    if (['OVERDUE', 'REFUNDED'].includes(data.status)) return 'EXPIRED'
    return 'PENDING'
  } catch {
    return null
  }
}

/* ---------------- Shared ---------------- */

export async function approvePayment(paymentId: string) {
  const payment = await db.payment.findUnique({ where: { id: paymentId } })
  if (!payment || payment.status === 'APPROVED') return
  await db.$transaction([
    db.payment.update({
      where: { id: payment.id },
      data: { status: 'APPROVED', approvedAt: new Date() },
    }),
    db.user.update({
      where: { id: payment.userId },
      data: { hasAccess: true, accessSource: 'PURCHASE', status: 'ACTIVE' },
    }),
  ])
}
