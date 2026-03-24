import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";
import { baserowFetch } from "../integrations/baserow/client.js";
import { baserowTables } from "../integrations/baserow/tables.js";
import { isProd, env } from "../shared/env.js";

const COOKIE = "__Host-rb_session";
const TTL_DAYS = 14;

function parseCookies(header?: string) {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    out[k] = decodeURIComponent(rest.join("=") || "");
  }
  return out;
}

function sha256Hex(v: string) {
  return crypto.createHash("sha256").update(v).digest("hex");
}

export type Session = {
  userId: string;
  email: string;
  tenantId: string;
  role: "user" | "admin" | "owner";
};

function setCookie(res: VercelResponse, token: string) {
  const maxAge = TTL_DAYS * 86400;
  res.setHeader("Set-Cookie", `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isProd ? "; Secure" : ""}`);
}

function clearCookie(res: VercelResponse) {
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

export async function createSession(req: VercelRequest, res: VercelResponse, input: Session) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256Hex(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TTL_DAYS * 86400_000);

  await baserowFetch(`/api/database/rows/table/${baserowTables.sessions}/?user_field_names=true`, {
    method: "POST",
    body: JSON.stringify({
      token_hash: tokenHash,
      tenant_id: input.tenantId,
      user_id: input.userId,
      email: input.email,
      role: input.role,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      revoked_at: "",
      ip: String(req.headers["x-forwarded-for"] ?? ""),
      user_agent: String(req.headers["user-agent"] ?? ""),
    }),
  });

  setCookie(res, token);
}

export async function getSession(req: VercelRequest): Promise<Session | null> {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE];
  if (!token) return null;

  const tokenHash = sha256Hex(token);
  const rows = await baserowFetch<{ results: any[] }>(
    `/api/database/rows/table/${baserowTables.sessions}/?user_field_names=true&filter__token_hash__equal=${tokenHash}`
  );
  const row = rows.results[0];
  if (!row) return null;
  if (row.revoked_at) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) return null;

  return {
    tenantId: String(row.tenant_id),
    userId: String(row.user_id),
    email: String(row.email),
    role: (row.role || "user") as any,
  };
}

export async function revokeSession(req: VercelRequest, res: VercelResponse) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE];
  clearCookie(res);
  if (!token) return;

  const tokenHash = sha256Hex(token);
  const rows = await baserowFetch<{ results: any[] }>(
    `/api/database/rows/table/${baserowTables.sessions}/?user_field_names=true&filter__token_hash__equal=${tokenHash}`
  );
  const row = rows.results[0];
  if (!row) return;

  await baserowFetch(`/api/database/rows/table/${baserowTables.sessions}/${row.id}/?user_field_names=true`, {
    method: "PATCH",
    body: JSON.stringify({ revoked_at: new Date().toISOString() }),
  });
}
