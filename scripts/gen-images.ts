import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

const OUT = '/home/z/my-project/public/uploads'
fs.mkdirSync(OUT, { recursive: true })

type Job = { file: string; prompt: string }

// NOTE: The task brief suggested 1440x720, but the backend API rejects it with
// error 400 code 1214 ("width/height must be multiples of 32"). 720 is not a
// multiple of 32. 1344x768 is the widest API-compliant wide size (7:4 ratio),
// so it is used for all mug-wrap art and heroes.
const SIZE = '1344x768'

const jobs: Job[] = [
  {
    file: 'art-flork-casal.png',
    prompt:
      'flork meme style white blob characters couple hugging with simple black outlines, floating red hearts, the word AMOR in bold rounded black letters, flat vector illustration print design, sublimation mug wrap artwork, wide horizontal composition, pure white background, vibrant colors, high quality print design',
  },
  {
    file: 'art-flork-cafe.png',
    prompt:
      'flork meme style white blob character happily holding a giant coffee cup, coffee beans and steam around, the word CAFE in bold rounded brown letters, flat vector illustration print design, sublimation mug wrap artwork, wide horizontal composition, pure white background, orange and brown colors, high quality print design',
  },
  {
    file: 'art-flork-amigas.png',
    prompt:
      'two flork meme style white blob characters doing pinky promise, stars and hearts, the word AMIGAS in bold rounded letters, flat vector illustration print design, sublimation mug wrap artwork, wide horizontal composition, pure white background, pink and purple accents, high quality print design',
  },
  {
    file: 'art-prof-enfermeira.png',
    prompt:
      'stylized nurse silhouette with stethoscope forming a heart shape, medical cross and sparkles, the word ENFERMEIRA in bold letters, flat vector illustration print design, sublimation mug wrap artwork, wide horizontal composition, pure white background, teal and red accents, glitter style, high quality print design',
  },
  {
    file: 'art-prof-professora.png',
    prompt:
      'cute teacher desk scene with pencils books apple and ruler, the word PROFESSORA in bold playful letters, flat vector illustration print design, sublimation mug wrap artwork, wide horizontal composition, pure white background, warm orange and green colors, high quality print design',
  },
  {
    file: 'art-prof-caminhoneiro.png',
    prompt:
      'big truck front view on open highway at sunset with road lines, the word CAMINHONEIRO in bold letters, flat vector illustration print design, sublimation mug wrap artwork, wide horizontal composition, pure white background, orange and black colors, high quality print design',
  },
  {
    file: 'art-relig-fe.png',
    prompt:
      'the word FE in huge bold elegant typography with a cross, flying doves and light rays, gold and black design, flat vector illustration print design, sublimation mug wrap artwork, wide horizontal composition, pure white background, elegant religious style, high quality print design',
  },
  {
    file: 'art-relig-versiculo.png',
    prompt:
      'open bible with watercolor flowers frame and the words TUDO POSSO in bold lettering, philippians 4 13 reference small text, watercolor illustration print design, sublimation mug wrap artwork, wide horizontal composition, pure white background, soft purple and green tones, high quality print design',
  },
  {
    file: 'art-frase-cafe.png',
    prompt:
      'hand lettering typography FIRST COFFEE phrase in Portuguese PRIMEIRO CAFE DEPOIS OS PROBLEMAS with steam coffee cup doodles, typographic print design, sublimation mug wrap artwork, wide horizontal composition, pure white background, black and orange lettering, high quality print design',
  },
  {
    file: 'art-animal-gato.png',
    prompt:
      'cute grumpy cat wearing glasses next to stack of books and coffee, the word MODO GATO in bold letters, flat vector illustration print design, sublimation mug wrap artwork, wide horizontal composition, pure white background, pastel colors, high quality print design',
  },
  {
    file: 'art-sazonal-maes.png',
    prompt:
      'the words FELIZ DIA DAS MAES in elegant floral lettering with carnation flowers hearts and gold sparkles, watercolor illustration print design, sublimation mug wrap artwork, wide horizontal composition, pure white background, pink and gold tones, high quality print design',
  },
  {
    file: 'art-sazonal-namorados.png',
    prompt:
      'two coffee mugs shaped like a couple with intertwined heart, the words DIA DOS NAMORADOS 12 DE JUNHO in bold letters, flat vector illustration print design, sublimation mug wrap artwork, wide horizontal composition, pure white background, red and white colors, high quality print design',
  },
  {
    file: 'art-sazonal-natal.png',
    prompt:
      'the words FELIZ NATAL in bold festive lettering with pine wreath ornaments gingerbread man and snowflakes, flat vector illustration print design, sublimation mug wrap artwork, wide horizontal composition, pure white background, red and green colors, high quality print design',
  },
  {
    file: 'art-sazonal-pascoa.png',
    prompt:
      'cute easter bunny painting colorful eggs, the words FELIZ PASCOA in playful bold letters, flat vector illustration print design, sublimation mug wrap artwork, wide horizontal composition, pure white background, pastel yellow and blue colors, high quality print design',
  },
  {
    file: 'hero-mug.png',
    prompt:
      'professional product photography of white ceramic mugs with vibrant orange and black tropical print designs, stacked on dark charcoal studio background, dramatic orange rim lighting, subtle smoke, ultra sharp, high quality commercial photography, wide banner composition',
  },
  {
    file: 'hero-press.png',
    prompt:
      'heat press machine transferring vibrant orange design onto white mug in dark workshop, glowing orange light, steam, professional photography, cinematic lighting, wide banner composition, high quality',
  },
]

async function genOne(zai: any, job: Job, retries = 6): Promise<{ ok: boolean; file: string; err?: string }> {
  const out = path.join(OUT, job.file)
  if (fs.existsSync(out) && fs.statSync(out).size > 20000) return { ok: true, file: job.file }
  for (let i = 1; i <= retries; i++) {
    try {
      const r = await zai.images.generations.create({ prompt: job.prompt, size: SIZE })
      const b64 = r?.data?.[0]?.base64
      if (!b64) throw new Error('empty base64')
      const buf = Buffer.from(b64, 'base64')
      if (buf.length < 10000) throw new Error('image too small')
      fs.writeFileSync(out, buf)
      console.log('OK', job.file, buf.length)
      return { ok: true, file: job.file }
    } catch (e: any) {
      const msg = String(e?.message || e)
      console.error('FAIL attempt', i, job.file, msg.slice(0, 140))
      // Rate-limit (429) needs a much longer cooldown than other errors.
      const backoff = msg.includes('429') ? 20000 * i : 5000 * i
      await new Promise(r => setTimeout(r, backoff))
    }
  }
  return { ok: false, file: job.file, err: 'failed after retries' }
}

async function main() {
  const zai = await ZAI.create()
  const results: any[] = []
  // Low concurrency + pacing to avoid 429 rate limits.
  const CONCURRENCY = 2
  const BATCH_DELAY_MS = 5000
  for (let i = 0; i < jobs.length; i += CONCURRENCY) {
    if (i > 0) await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
    const batch = jobs.slice(i, i + CONCURRENCY)
    const res = await Promise.all(batch.map(j => genOne(zai, j)))
    results.push(...res)
    const doneOk = results.filter(r => r.ok).length
    console.log(`[progress] ${doneOk}/${jobs.length} done`)
  }
  const failed = results.filter(r => !r.ok)
  console.log(JSON.stringify({ total: results.length, ok: results.filter(r => r.ok).length, failed }))
  if (failed.length > 0) process.exitCode = 1
}
main()
