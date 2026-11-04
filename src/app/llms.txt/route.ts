import { llmsContent } from '@/lib/llms-content'
export const dynamic = 'force-static'
export function GET() {
  return new Response(llmsContent(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
