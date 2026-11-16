import { getSessionUser, jsonError } from '@/lib/auth'
import { isSafeOrigin } from '@/lib/security-guards'
import { putImage } from '@/lib/storage'
export const runtime='nodejs'
export async function POST(req: Request) {
  if((await getSessionUser())?.role!=='ADMIN')return jsonError('Acesso restrito ao Admin Mestre',403)
  if(!isSafeOrigin(req)) return jsonError('Origem não permitida',403)
  try {
    const form=await req.formData(),file=form.get('file')
    if(!(file instanceof File))return jsonError('Selecione uma imagem',400)
    const types:Record<string,string>={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}
    const ext=types[file.type]
    if(!ext||file.size<100||file.size>10*1024*1024)return jsonError('Envie PNG, JPG ou WebP até 10 MB',400)
    const buffer=Buffer.from(await file.arrayBuffer())
    const url=await putImage(buffer,ext,'hub-banners')
    return Response.json({url},{headers:{'Cache-Control':'no-store'}})
  }catch(error){return jsonError(error instanceof Error?error.message:'Erro no envio da imagem',500)}
}
