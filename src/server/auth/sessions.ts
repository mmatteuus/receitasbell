import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';
import { env, isProd } from '../shared/env.js';
import { baserowFetch } from '../integrations/baserow/client.js';
import { setCookie, clearCookie } from '../shared/cookies.js';

const SESSION_COOKIE = '__Host-rb_user_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 dias

type SessionRow = {
  id: number;
  session_hash: string;
  user_id: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  tenant_id: string | null;
  issued_at: string;
  expires_at: string;
  revoked_at?: string | null;
};

function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map(p => p.trim()).filter(Boolean).map(p => {
      const idx = p.indexOf('=');
      if (idx === -1) return [p, ''];
      return [p.slice(0, idx), decodeURIComponent(p.slice(idx + 1))];
    }),
  );
}

export interface UserSession {
  sessionId: string;
  userId: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  tenantId?: string;
  issuedAt: number;
  expiresAt: number;
}

export async function createUserSession(input: { 
  userId: string; 
  email: string; 
  role: 'user' | 'admin' | 'superadmin';
  tenantId?: string;
  req: VercelRequest; 
  res: VercelResponse; 
}) {
  const rawSessionId = crypto.randomBytes(32).toString('hex');
  const sessionHash = sha256Hex(rawSessionId);
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);

  await baserowFetch<{ id: number }>(`/api/database/rows/table/${env.BASEROW_TABLE_USER_SESSIONS}/?user_field_names=true`, {
    method: 'POST',
    body: JSON.stringify({
      session_hash: sessionHash,
      user_id: input.userId,
      email: input.email,
      role: input.role,
      tenant_id: input.tenantId || null,
      issued_at: now.toISOString(),
      expires_at: expires.toISOString(),
      revoked_at: null,
      last_seen_at: now.toISOString(),
      ip: (input.req.headers['x-forwarded-for'] ?? '').toString().slice(0, 200),
      user_agent: (input.req.headers['user-agent'] ?? '').toString().slice(0, 300),
    }),
  });

  input.res.setHeader('Set-Cookie', [
    setCookie(SESSION_COOKIE, rawSessionId, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'Lax',
      path: '/', // obrigatório p/ __Host-
      maxAgeSeconds: SESSION_TTL_SECONDS,
    }),
  ]);

  return { sessionId: rawSessionId, expiresAt: expires.getTime() };
}

export async function getUserSession(req: VercelRequest): Promise<UserSession | null> {
  const cookies = parseCookies(req.headers.cookie);
  const rawSessionId = cookies[SESSION_COOKIE];
  if (!rawSessionId) return null;

  const sessionHash = sha256Hex(rawSessionId);
  const rows = await baserowFetch<{ results: SessionRow[] }>(
    `/api/database/rows/table/${env.BASEROW_TABLE_USER_SESSIONS}/?user_field_names=true&filter__session_hash__equal=${sessionHash}`,
  );

  const row = rows.results[0];
  if (!row) return null;
  if (row.revoked_at) return null;

  const issued = Date.parse(row.issued_at);
  const exp = Date.parse(row.expires_at);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;

  return {
    sessionId: rawSessionId,
    userId: row.user_id,
    email: row.email,
    role: row.role || 'user',
    tenantId: row.tenant_id || undefined,
    issuedAt: issued,
    expiresAt: exp
  };
}

export async function revokeUserSession(req: VercelRequest, res: VercelResponse) {
  const cookies = parseCookies(req.headers.cookie);
  const rawSessionId = cookies[SESSION_COOKIE];
  res.setHeader('Set-Cookie', [clearCookie(SESSION_COOKIE)]);

  if (!rawSessionId) return;
  const sessionHash = sha256Hex(rawSessionId);

  const rows = await baserowFetch<{ results: { id: number }[] }>(
    `/api/database/rows/table/${env.BASEROW_TABLE_USER_SESSIONS}/?user_field_names=true&filter__session_hash__equal=${sessionHash}`,
  );
  const row = rows.results[0];
  if (!row) return;

  await baserowFetch(
    `/api/database/rows/table/${env.BASEROW_TABLE_USER_SESSIONS}/${row.id}/?user_field_names=true`,
    { method: 'PATCH', body: JSON.stringify({ revoked_at: new Date().toISOString() }) },
  );
}
