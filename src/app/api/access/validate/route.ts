import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/admin-auth";
import {
  BROWSER_COOKIE,
  browserToken,
  hashToken,
  newToken,
} from "@/lib/premium-session";

export const runtime = "nodejs";
export async function POST(req: Request) {
  let body: { code?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }
  const code = String(body.code ?? "")
    .trim()
    .toUpperCase();
  if (!code || code.length > 32)
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`studio-login:${ip}`, 30, 10 * 60_000))
    return NextResponse.json({ ok: false, reason: "rate" }, { status: 429 });
  const browser = browserToken(req) ?? newToken();
  const browserHash = hashToken(browser);
  const sessionToken = newToken();
  const now = new Date();
  try {
    // Atomic browser claim also invalidates any previous session.
    const result = await db.$transaction(async (tx) => {
      const row = await tx.accessCode.findUnique({ where: { code } });
      if (!row || !row.active) return { ok: false as const, reason: "invalid" };
      if (row.expiresAt && row.expiresAt <= now)
        return { ok: false as const, reason: "expired" };
      const updated = await tx.accessCode.updateMany({
        where: {
          id: row.id,
          active: true,
          AND: [
            { OR: [{ browserHash: null }, { browserHash }] },
            { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          ],
        },
        data: {
          browserHash,
          sessionHash: hashToken(sessionToken),
          sessionExpiresAt: new Date(Date.now() + 12 * 3600_000),
          maxUses: 1,
        },
      });
      if (!updated.count) return { ok: false as const, reason: "browser" };
      await tx.accessCodeUse.upsert({
        where: { codeId_deviceId: { codeId: row.id, deviceId: browserHash } },
        create: { codeId: row.id, deviceId: browserHash },
        update: { usedAt: now },
      });
      return {
        ok: true as const,
        sessionToken,
        clientName: row.clientName,
        plan: row.clientType === "library" ? "Biblioteca Click Gruda" : "Anual",
      };
    });
    const response = NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
    if (result.ok)
      response.cookies.set(BROWSER_COOKIE, browser, {
        httpOnly: true,
        sameSite: "strict",
        secure: new URL(req.url).protocol === "https:",
        path: "/",
        maxAge: 365 * 86400,
      });
    return response;
  } catch (error) {
    console.error(
      "Studio access unavailable",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json({ ok: false, reason: "network" }, { status: 503 });
  }
}
