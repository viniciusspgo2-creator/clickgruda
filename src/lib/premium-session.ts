import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const BROWSER_COOKIE = "cg_studio_browser";
export const hashToken = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const newToken = () => randomBytes(32).toString("hex");
export function browserToken(req: Request) {
  const value = req.headers
    .get("cookie")
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(BROWSER_COOKIE + "="))
    ?.slice(BROWSER_COOKIE.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}
export async function checkPremiumSession(req: Request) {
  if (requireAdmin(req)) return { ok: true as const, plan: "Admin Master" };
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const browser = browserToken(req);
  if (!browser || !/^[a-f0-9]{64}$/.test(token))
    return { ok: false as const, reason: "session" };
  const row = await db.accessCode.findFirst({
    where: { sessionHash: hashToken(token), browserHash: hashToken(browser) },
  });
  if (!row || !row.active) return { ok: false as const, reason: "session" };
  if (row.expiresAt && row.expiresAt <= new Date())
    return { ok: false as const, reason: "expired" };
  if (!row.sessionExpiresAt || row.sessionExpiresAt <= new Date())
    return { ok: false as const, reason: "session" };
  return {
    ok: true as const,
    plan: row.clientType === "library" ? "Biblioteca Click Gruda" : "Anual",
    clientName: row.clientName,
  };
}
