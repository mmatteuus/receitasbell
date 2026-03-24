import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash, randomBytes } from "node:crypto";
import { fetchBaserow } from "../integrations/baserow/client.js";
import { baserowTables } from "../integrations/baserow/tables.js";
import { ApiError, getClientAddress } from "../shared/http.js";

export type SessionRole = "user" | "admin" | "superadmin";

export type SessionRecord = {
  id: string | number;
  tenantId: string;
  userId: string;
  email: string;
  role: SessionRole;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string | null;
  ip?: string;
  userAgent?: string;
};

const COOKIE_NAME = "__Host-rb_session";
const TTL_DAYS = 7;

function base64Url(bytes: Buffer) {
  return bytes.toString("base64url");
}

function sha256Hex(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

export function setSessionCookie(res: VercelResponse, token: string) {
  const isProd = process.env.NODE_ENV === "production";
  const maxAge = 60 * 60 * 24 * TTL_DAYS;

  // MDN: cookies, SameSite; __Host- prefix exige Secure e Path=/
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isProd ? "; Secure" : ""}`
  );
}

export function clearSessionCookie(res: VercelResponse) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function readCookie(req: VercelRequest, name: string) {
  const cookieHeader = req.headers.cookie || "";
  const parts = cookieHeader.split(";").map((c) => c.trim());
  for (const p of parts) {
    const [k, ...rest] = p.split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

export async function createSession(req: VercelRequest, input: {
  tenantId: string;
  userId: string;
  email: string;
  role: SessionRole;
}) {
  const token = base64Url(randomBytes(32));
  const tokenHash = sha256Hex(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TTL_DAYS * 24 * 60 * 60 * 1000);

  const row = await fetchBaserow<any>(`/api/database/rows/table/${baserowTables.sessions}/?user_field_names=true`, {
    method: "POST",
    body: JSON.stringify({
      tenantId: String(input.tenantId),
      userId: String(input.userId),
      email: input.email,
      role: input.role,
      tokenHash,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      revokedAt: null,
      ip: getClientAddress(req),
      userAgent: req.headers["user-agent"] || "unknown",
    }),
  });

  return { token, rowId: row.id };
}

export async function getSession(req: VercelRequest): Promise<SessionRecord | null> {
  const token = readCookie(req, COOKIE_NAME);
  if (!token) return null;

  const tokenHash = sha256Hex(token);
  const data = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${baserowTables.sessions}/?user_field_names=true&filter__tokenHash__equal=${tokenHash}`
  );

  const row = data.results[0];
  if (!row) return null;

  if (row.revokedAt && row.revokedAt.trim() !== "") return null;
  if (new Date(row.expiresAt).getTime() <= Date.now()) return null;

  return {
    id: row.id,
    tenantId: String(row.tenantId),
    userId: String(row.userId),
    email: String(row.email),
    role: row.role as SessionRole,
    tokenHash: String(row.tokenHash),
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt || null,
    ip: row.ip,
    userAgent: row.userAgent,
  };
}

export async function requireSession(req: VercelRequest): Promise<SessionRecord> {
  const s = await getSession(req);
  if (!s) throw new ApiError(401, "Not authenticated");
  return s;
}

export async function revokeCurrentSession(req: VercelRequest) {
  const token = readCookie(req, COOKIE_NAME);
  if (!token) return;

  const tokenHash = sha256Hex(token);
  const data = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${baserowTables.sessions}/?user_field_names=true&filter__tokenHash__equal=${tokenHash}`
  );

  const row = data.results[0];
  if (!row) return;

  await fetchBaserow(`/api/database/rows/table/${baserowTables.sessions}/${row.id}/?user_field_names=true`, {
    method: "PATCH",
    body: JSON.stringify({ revokedAt: new Date().toISOString() }),
  });
}
