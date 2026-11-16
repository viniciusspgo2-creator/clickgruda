import 'server-only'
import {createHmac} from 'node:crypto'
/** Tráfego exclusivamente servidor→servidor. Não expor esta chave no navegador. */
export async function studioMasterCommand(payload:Record<string,unknown>){
 const secret=process.env.UNIFIED_SSO_SECRET
 const base=process.env.STUDIO_API_ORIGIN
 if(!secret||secret.length<32||!base)throw Error('Integração com Studio não configurada.')
 const origin=new URL(base)
 if(origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash||!(origin.protocol==='https:'||(process.env.NODE_ENV!=='production'&&origin.hostname==='localhost'&&origin.protocol==='http:')))throw Error('Origem do Studio inválida.')
 const path='/api/integrations/portal-admin',stamp=String(Math.floor(Date.now()/1000)),raw=JSON.stringify(payload)
 const signature='v1='+createHmac('sha256',secret).update(`POST\n${path}\n${stamp}\n${raw}`).digest('hex')
 const response=await fetch(new URL(path,origin.origin),{method:'POST',headers:{'Content-Type':'application/json','X-Portal-Timestamp':stamp,'X-Portal-Signature':signature},body:raw,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)})
 const data=await response.json().catch(()=>({error:'Resposta inválida do Studio.'}))
 if(!response.ok||data.ok!==true)throw Error(data.error||'Studio indisponível.')
 return data
}
