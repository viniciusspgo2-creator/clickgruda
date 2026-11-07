import { freeSignupEnabled } from '@/lib/studio-bonus'
export async function GET() {
  return Response.json(
    {
      freeSignup: freeSignupEnabled(),
      downloads: 20,
      libraryHours: 24,
      studioDays: 7,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
