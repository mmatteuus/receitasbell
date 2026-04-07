import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";
import { isProd, env } from "../shared/env.js";
import { ApiError } from "../shared/http.js";
import { decryptSecret, encryptSecret, sha256Hex } from "../shared/crypto.js";
import { supabase, supabaseAdmin } from "../integrations/supabase/client.js";

export const COOKIE_NAME = isProd ? "__Host-rb_session" : "rb_session";
const TTL_DAYS = 14;
const STATELESS_COOKIE_PREFIX = "rb1.";

export type Session = {
  userId: string;
  email: string;
  tenantId: string;
  role: "user" | "admin" | "owner";
};

type StatelessSessionPayload = Session & {
  exp: number;
};

function parseCookies(header?: string) {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    out[k] = decodeURIComponent(rest.join("=") || "");
  }
  return out;
}

function setCookie(res: VercelResponse, token: string) {
  const maxAge = TTL_DAYS * 86400;
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isProd ? "; Secure" : ""}`);
}

function clearCookie(res: VercelResponse) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

export function signSession(input: Session & { expiresAt?: number }) {
  const payload: StatelessSessionPayload = {
    userId: String(input.userId),
    email: String(input.email),
    tenantId: String(input.tenantId),
    role: input.role === "admin" || input.role === "owner" ? input.role : "user",
    exp: input.expiresAt ?? Date.now() + TTL_DAYS * 86400_000,
  };

  return `${STATELESS_COOKIE_PREFIX}${encryptSecret(JSON.stringify(payload))}`;
}

function readSignedSession(token: string | undefined): Session | null {
  if (!token || !token.startsWith(STATELESS_COOKIE_PREFIX)) return null;

  try {
    const decrypted = decryptSecret(token.slice(STATELESS_COOKIE_PREFIX.length));
    const payload = JSON.parse(decrypted) as Partial<StatelessSessionPayload>;
    if (!payload.exp || payload.exp <= Date.now()) return null;
    if (!payload.userId || !payload.email || !payload.tenantId) return null;

    return {
      userId: String(payload.userId),
      email: String(payload.email),
      tenantId: String(payload.tenantId),
      role: payload.role === "admin" || payload.role === "owner" ? payload.role : "user",
    };
  } catch {
    return null;
  }
}

export async function createSession(req: VercelRequest, res: VercelResponse, input: Session) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256Hex(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TTL_DAYS * 86400_000);

  try {
    const { error } = await supabaseAdmin.from("auth_sessions").insert({
      token_hash: tokenHash,
      tenant_id: input.tenantId,
      user_id: input.userId,
      email: input.email.toLowerCase().trim(),
      role: input.role,
      expires_at: expiresAt.toISOString(),
      ip: String(req.headers["x-forwarded-for"] ?? ""),
      user_agent: String(req.headers["user-agent"] ?? ""),
    });

    if (error) {
      console.warn("Session DB insert failed, falling back to stateless:", error);
      setCookie(res, signSession({ ...input, expiresAt: expiresAt.getTime() }));
      return;
    }
  } catch (err) {
    console.error("Session DB critical error, falling back to stateless:", err);
    setCookie(res, signSession({ ...input, expiresAt: expiresAt.getTime() }));
    return;
  }

  setCookie(res, token);
}

export function setUserSessionCookie(res: VercelResponse, token: string) {
  setCookie(res, token);
}

export function clearUserSessionCookie(res: VercelResponse) {
  clearCookie(res);
}

export async function getSession(req: VercelRequest): Promise<Session | null> {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  const signedSession = readSignedSession(token);
  if (signedSession) return signedSession;

  const tokenHash = sha256Hex(token);
  const { data, error } = await supabaseAdmin
    .from("auth_sessions")
    .select("*")
    .eq("token_hash", tokenHash)
    .single();

  if (error || !data) return null;
  if (data.revoked_at) return null;
  if (!data.expires_at || new Date(data.expires_at).getTime() <= Date.now()) return null;

  const role = data.role === "admin" || data.role === "owner" ? data.role : "user";
  const session: Session = {
    tenantId: String(data.tenant_id),
    userId: String(data.user_id),
    email: String(data.email),
    role,
  };

  // P1-2: Garantir que o usuário ainda está ativo
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("is_active")
    .eq("id", session.userId)
    .single();

  if (!profile || !profile.is_active) {
    return null;
  }

  return session;
}

export const getUserSession = getSession;

export async function requireTenantAdminSessionContext(req: VercelRequest) {
  const session = await getSession(req);
  if (!session || (session.role !== "admin" && session.role !== "owner")) {
    throw new ApiError(401, "Administrative session required");
  }

  return {
    tenant: { id: String(session.tenantId), slug: "", name: "" },
    tenantUser: {
      id: String(session.userId),
      email: session.email,
      role: session.role,
      name: session.email,
    },
    session,
    resolution: "session" as const,
  };
}

export async function revokeSession(req: VercelRequest, res: VercelResponse) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  clearCookie(res);
  if (!token) return;
  if (readSignedSession(token)) return;

  const tokenHash = sha256Hex(token);
  await supabaseAdmin
    .from("auth_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("token_hash", tokenHash);
}
