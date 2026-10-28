import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
export const runtime = "nodejs";
const bad = (error: string, status = 400) =>
  NextResponse.json({ ok: false, error }, { status });
const unauthorized = () => bad("Não autorizado.", 401);
const trim = (v: unknown, max = 120) =>
  String(v ?? "")
    .trim()
    .slice(0, max);
function expiry(
  body: Record<string, unknown>,
  type: string,
  creating: boolean,
): Date | null | undefined {
  if (body.expiresAt !== undefined) {
    if (body.expiresAt === null && type === "library") return null;
    const date = new Date(String(body.expiresAt));
    if (!Number.isFinite(date.getTime()))
      throw new Error("Informe uma validade válida.");
    return date;
  }
  if (creating)
    return type === "standalone"
      ? new Date(Date.now() + 24 * 60 * 60_000)
      : null;
  return undefined;
}
export async function GET(req: Request) {
  if (!requireAdmin(req)) return unauthorized();
  const rows = await db.accessCode.findMany({
    include: { uses: { orderBy: { usedAt: "desc" } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return NextResponse.json(
    {
      ok: true,
      codes: rows.map((r) => ({
        code: r.code,
        note: r.note,
        clientName: r.clientName,
        clientType: r.clientType,
        maxUses: 1,
        active: r.active,
        bound: !!r.browserHash,
        expiresAt: r.expiresAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        uses: r.browserHash ? 1 : 0,
        lastUsedAt: r.uses[0]?.usedAt.toISOString() ?? null,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(req: Request) {
  if (!requireAdmin(req)) return unauthorized();
  try {
    const body = await req.json();
    const clientName = trim(body.clientName);
    if (!clientName) return bad("Informe o nome do cliente.");
    if (!["library", "standalone"].includes(body.clientType))
      return bad("Selecione Biblioteca ou Avulso.");
    const expiresAt = expiry(body, body.clientType, true);
    const prefix =
      trim(body.prefix, 8)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "") || "CG";
    const code = `${prefix}-${randomBytes(6).toString("hex").toUpperCase()}`;
    await db.accessCode.create({
      data: {
        code,
        clientName,
        clientType: body.clientType,
        note: trim(body.note),
        maxUses: 1,
        expiresAt,
      },
    });
    return NextResponse.json({ ok: true, created: [code] });
  } catch (e) {
    return bad(
      e instanceof Error && !("code" in e)
        ? e.message
        : "Não foi possível gerar o código.",
    );
  }
}
export async function PATCH(req: Request) {
  if (!requireAdmin(req)) return unauthorized();
  try {
    const body = await req.json();
    const code = trim(body.code, 32).toUpperCase();
    const row = await db.accessCode.findUnique({ where: { code } });
    if (!row) return bad("Código não encontrado.", 404);
    const clientType = body.clientType ?? row.clientType;
    if (!["library", "standalone"].includes(clientType))
      return bad("Tipo de cliente inválido.");
    const clientName =
      body.clientName === undefined ? row.clientName : trim(body.clientName);
    if (!clientName) return bad("Informe o nome do cliente.");
    let expiresAt = expiry(body, clientType, false);
    if (
      clientType === "standalone" &&
      expiresAt === undefined &&
      !row.expiresAt
    )
      expiresAt = new Date(Date.now() + 24 * 60 * 60_000);
    const data: Prisma.AccessCodeUpdateInput = {
      clientName,
      clientType,
      maxUses: 1,
      ...(expiresAt !== undefined ? { expiresAt } : {}),
      ...(typeof body.active === "boolean" ? { active: body.active } : {}),
      ...(typeof body.note === "string" ? { note: trim(body.note) } : {}),
    };
    if (body.resetBrowser === true) data.browserHash = null;
    // Every administrative access change requires reauthentication.
    data.sessionHash = null;
    data.sessionExpiresAt = null;
    await db.$transaction(async (tx) => {
      await tx.accessCode.update({ where: { code }, data });
      if (body.resetBrowser === true)
        await tx.accessCodeUse.deleteMany({ where: { codeId: row.id } });
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return bad(
      e instanceof Error && !("code" in e)
        ? e.message
        : "Não foi possível atualizar o código.",
    );
  }
}
export async function DELETE(req: Request) {
  if (!requireAdmin(req)) return unauthorized();
  const code = new URL(req.url).searchParams.get("code")?.trim().toUpperCase();
  if (!code) return bad("Código ausente.");
  try {
    await db.accessCode.delete({ where: { code } });
    return NextResponse.json({ ok: true });
  } catch {
    return bad("Código não encontrado.", 404);
  }
}
