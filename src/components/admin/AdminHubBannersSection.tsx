'use client'
import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { HUB_BANNER_SECTIONS, type HubBanner, type BannerSection } from '@/lib/hub-banner-types'

const blank = (section: BannerSection):HubBanner => ({id:`banner-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`,section,title:'',description:'',eyebrow:'',imageUrl:'',href:'hub:biblioteca',enabled:false,order:999})

export function AdminHubBannersSection() {
  const [items,setItems]=useState<HubBanner[]>([])
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [uploading,setUploading]=useState<string|null>(null)
  useEffect(()=>{let active=true;(async()=>{
    try{const r=await fetch('/api/admin/hub-banners',{cache:'no-store'});if(!r.ok)throw Error('Não foi possível carregar os banners');const d=await r.json();if(active)setItems(d.banners)}
    catch(e){toast.error(e instanceof Error?e.message:'Erro ao carregar')}
    finally{if(active)setLoading(false)}
  })();return()=>{active=false}},[])
  function change(id:string,part:Partial<HubBanner>){setItems(prev=>prev.map(x=>x.id===id?{...x,...part}:x))}
  function swap(id:string,direction:-1|1){setItems(prev=>{
    const sorted=[...prev],i=sorted.findIndex(x=>x.id===id);if(i<0)return prev
    const same=sorted.map((x,j)=>({x,j})).filter(v=>v.x.section===sorted[i].section).map(v=>v.j)
    const at=same.indexOf(i),other=same[at+direction];if(other==null)return prev
    const replaced=[...sorted];[replaced[i],replaced[other]]=[replaced[other],replaced[i]]
    return replaced.map((x,index)=>({...x,order:index+1}))
  })}
  async function upload(id:string,file:File){setUploading(id);try{
    const form=new FormData();form.append('file',file)
    const r=await fetch('/api/admin/hub-banners/upload',{method:'POST',body:form});const d=await r.json();if(!r.ok)throw Error(d.error||'Falha ao enviar imagem')
    change(id,{imageUrl:d.url});toast.success('Imagem enviada')
  }catch(e){toast.error(e instanceof Error?e.message:'Falha no upload')}finally{setUploading(null)}}
  async function save(){setSaving(true);try{
    const payload=items.map((x,i)=>({...x,order:i+1}))
    const r=await fetch('/api/admin/hub-banners',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({banners:payload})});const d=await r.json();if(!r.ok)throw Error(d.error||'Erro ao salvar')
    setItems(d.banners);toast.success('Carrosséis atualizados!')
  }catch(e){toast.error(e instanceof Error?e.message:'Erro ao salvar')}finally{setSaving(false)}}
  if(loading)return <p className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin"/>Carregando carrosséis...</p>
  return <div className="space-y-7 text-zinc-900">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-black tracking-tight">Banners & Carrosséis 2.0</h2><p className="mt-1 text-sm text-zinc-500">Cada seção é um carrossel independente. Gerencie as imagens sem alterar código.</p></div><button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{saving?<Loader2 className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4"/>} Salvar alterações</button></div>
    {HUB_BANNER_SECTIONS.map(section=><section key={section.id} className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-black">{section.title}</h3><p className="text-xs text-zinc-500">{section.subtitle}</p></div><button type="button" onClick={()=>setItems(x=>[...x,blank(section.id)])} className="inline-flex items-center gap-2 rounded-xl border border-orange-300 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700"><Plus className="h-4 w-4"/>Adicionar banner</button></div>
      <div className="space-y-4">{items.filter(x=>x.section===section.id).map(item=><article key={item.id} className="grid gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 lg:grid-cols-[210px_1fr]">
        <div className="space-y-2"><div className="aspect-[4/3] overflow-hidden rounded-xl bg-zinc-900">{item.imageUrl?<img src={item.imageUrl} alt="Prévia do banner" className="h-full w-full object-cover"/>:<div className="grid h-full place-items-center text-zinc-500"><ImagePlus/></div>}</div><label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white p-2 text-xs font-bold">{uploading===item.id?<Loader2 className="h-4 w-4 animate-spin"/>:<ImagePlus className="h-4 w-4"/>}Enviar imagem <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={!!uploading} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(item.id,file);e.target.value=''}}/></label></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-zinc-600">Título<input value={item.title} onChange={e=>change(item.id,{title:e.target.value})} maxLength={100} placeholder="Título principal" className="mt-1 w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-sm"/></label>
          <label className="text-xs font-bold text-zinc-600">Etiqueta<input value={item.eyebrow} onChange={e=>change(item.id,{eyebrow:e.target.value})} maxLength={45} placeholder="NOVIDADE" className="mt-1 w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-sm"/></label>
          <label className="text-xs font-bold text-zinc-600 sm:col-span-2">Descrição<input value={item.description} onChange={e=>change(item.id,{description:e.target.value})} maxLength={240} className="mt-1 w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-sm"/></label>
          <label className="text-xs font-bold text-zinc-600">Imagem (URL ou upload)<input value={item.imageUrl} onChange={e=>change(item.id,{imageUrl:e.target.value})} placeholder="/uploads/... ou https://..." className="mt-1 w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-xs"/></label>
          <label className="text-xs font-bold text-zinc-600">Destino<input value={item.href} onChange={e=>change(item.id,{href:e.target.value})} placeholder="hub:3d ou https://..." className="mt-1 w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-xs"/></label>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2"><button type="button" onClick={()=>change(item.id,{enabled:!item.enabled})} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold ${item.enabled?'border-emerald-200 bg-emerald-50 text-emerald-700':'border-zinc-300 bg-white text-zinc-500'}`}>{item.enabled?<Eye size={15}/>:<EyeOff size={15}/>} {item.enabled?'Publicado':'Oculto'}</button><button type="button" onClick={()=>swap(item.id,-1)} aria-label="Mover banner para esquerda" className="rounded-lg border bg-white p-2"><ArrowUp size={16}/></button><button type="button" onClick={()=>swap(item.id,1)} aria-label="Mover banner para direita" className="rounded-lg border bg-white p-2"><ArrowDown size={16}/></button><button type="button" onClick={()=>setItems(prev=>prev.filter(x=>x.id!==item.id))} className="ml-auto inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600"><Trash2 size={15}/>Excluir</button></div>
        </div>
      </article>)}{items.every(x=>x.section!==section.id)&&<p className="rounded-xl bg-zinc-50 p-6 text-center text-sm text-zinc-500">Nenhum banner nesta seção. Adicione o primeiro.</p>}</div>
    </section>)}
  </div>
}
