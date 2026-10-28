/* ============================================================
   Registro de imagens da arte — 100% no dispositivo.
   Load, validação, downsampling e arte de exemplo procedural.
   ============================================================ */

import { MAX_ART_PX, MAX_UPLOAD_MB } from "./config";

export interface ArtImageEntry {
  id: string;
  source: CanvasImageSource; // ImageBitmap | HTMLImageElement | HTMLCanvasElement
  width: number; // px naturais (após eventual downsampling)
  height: number;
  naturalWidth: number; // px originais (para DPI)
  naturalHeight: number;
  name: string;
  url?: string; // objectURL (revogado ao substituir)
}

const registry = new Map<string, ArtImageEntry>();
let seq = 0;

export function getArtImage(id: string | null): ArtImageEntry | null {
  if (!id) return null;
  return registry.get(id) ?? null;
}

export function removeArtImage(id: string | null) {
  if (!id) return;
  const e = registry.get(id);
  if (e?.url) URL.revokeObjectURL(e.url);
  registry.delete(id);
}

const ACCEPTED = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  "image/gif",
  "image/bmp",
];

export function validateFile(file: File): string | null {
  if (!ACCEPTED.includes(file.type))
    return "Formato não suportado. Use PNG, JPG, WebP, SVG ou AVIF.";
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024)
    return `Arquivo muito grande (máximo ${MAX_UPLOAD_MB} MB).`;
  return null;
}

/** Redimensiona via canvas se exceder MAX_ART_PX, mantendo qualidade */
function downscale(
  source: CanvasImageSource,
  w: number,
  h: number,
): { source: CanvasImageSource; w: number; h: number } {
  const maxSide = Math.max(w, h);
  if (maxSide <= MAX_ART_PX) return { source, w, h };
  const f = MAX_ART_PX / maxSide;
  const tw = Math.round(w * f);
  const th = Math.round(h * f);
  const c = document.createElement("canvas");
  c.width = tw;
  c.height = th;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, tw, th);
  return { source: c, w: tw, h: th };
}

async function decode(
  file: Blob,
  isSvg: boolean,
): Promise<{
  source: CanvasImageSource;
  w: number;
  h: number;
  keepUrl?: string;
}> {
  // SVG e fallbacks: HTMLImageElement (createImageBitmap não decora SVG bem)
  if (isSvg || typeof createImageBitmap === "undefined") {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = "async";
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("decode"));
        img.src = url;
      });
      const r = downscale(
        img,
        img.naturalWidth || 1024,
        img.naturalHeight || 1024,
      );
      // para SVG mantemos a URL viva (img precisa do src)
      return { ...r, keepUrl: url } as {
        source: CanvasImageSource;
        w: number;
        h: number;
        keepUrl?: string;
      };
    } catch (e) {
      URL.revokeObjectURL(url);
      throw e;
    }
  }
  const bmp = await createImageBitmap(file);
  const r = downscale(bmp, bmp.width, bmp.height);
  if (r.source === bmp) return { source: bmp, w: bmp.width, h: bmp.height };
  bmp.close();
  return { source: r.source, w: r.w, h: r.h };
}

export async function loadArtFile(file: File): Promise<ArtImageEntry> {
  const err = validateFile(file);
  if (err) throw new Error(err);
  return loadArtBlob(file, file.name || "arte");
}

/** carrega um Blob já validado (restauração de projetos) */
export async function loadArtBlob(
  blob: Blob,
  name: string,
): Promise<ArtImageEntry> {
  const d = await decode(blob, blob.type === "image/svg+xml");
  const id = `art_${Date.now()}_${++seq}`;
  const entry: ArtImageEntry = {
    id,
    source: d.source,
    width: d.w,
    height: d.h,
    naturalWidth: d.w,
    naturalHeight: d.h,
    name,
    url: d.keepUrl,
  };
  registry.set(id, entry);
  return entry;
}

/** serializa a arte atual como PNG (para salvar no projeto) */
export async function getArtBlob(id: string | null): Promise<Blob | null> {
  const e = getArtImage(id);
  if (!e) return null;
  const c = document.createElement("canvas");
  c.width = e.width;
  c.height = e.height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(e.source, 0, 0);
  return new Promise((res) => c.toBlob((b) => res(b), "image/png"));
}

/* ---------------- Arte de exemplo procedural ---------------- */

export function makeSampleArt(): ArtImageEntry {
  const W = 1400;
  const H = 700;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#e8703a");
  g.addColorStop(0.55, "#d95f2b");
  g.addColorStop(1, "#1d130d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // círculos decorativos
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#ffffff";
  for (const [x, y, r] of [
    [180, 160, 120],
    [1150, 520, 180],
    [700, 90, 70],
  ] as const) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // coração
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(700, 250);
  ctx.bezierCurveTo(640, 190, 545, 215, 545, 300);
  ctx.bezierCurveTo(545, 375, 645, 430, 700, 470);
  ctx.bezierCurveTo(755, 430, 855, 375, 855, 300);
  ctx.bezierCurveTo(855, 215, 760, 190, 700, 250);
  ctx.fill();
  ctx.fillStyle = "#e8703a";
  ctx.font = "800 86px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("&", 700, 330);

  // textos
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 92px sans-serif";
  ctx.fillText("CLICK & GRUDA", 700, 575);
  ctx.font = "600 34px sans-serif";
  ctx.globalAlpha = 0.85;
  ctx.fillText("A R T E   D E   E X E M P L O", 700, 640);
  ctx.globalAlpha = 1;

  const id = `art_sample_${++seq}`;
  const entry: ArtImageEntry = {
    id,
    source: c,
    width: W,
    height: H,
    naturalWidth: W,
    naturalHeight: H,
    name: "arte-exemplo",
  };
  registry.set(id, entry);
  return entry;
}
