import { readHubBanners, DEFAULT_HUB_BANNERS } from '@/lib/hub-banners'
export const dynamic = 'force-dynamic'
export async function GET() {
  try { return Response.json({ banners: (await readHubBanners()).filter(item=>item.enabled) }, { headers: {'Cache-Control':'private, no-store'} }) }
  catch { return Response.json({ banners: DEFAULT_HUB_BANNERS }, {status:200,headers:{'Cache-Control':'no-store'}}) }
}
