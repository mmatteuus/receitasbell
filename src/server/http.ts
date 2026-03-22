import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getAdminApiSecret } from './env.js';
import { hasTenantAdminSession } from './auth/sessions.js';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function sendJson(response: VercelResponse, status: number, data: unknown) {
  response.setHeader('Cache-Control', 'no-store');
  response.status(status).json(data);
}

export function sendNoContent(response: VercelResponse) {
  response.setHeader('Cache-Control', 'no-store');
  response.status(204).end();
}

export function appendSetCookie(response: VercelResponse, cookie: string) {
  const current = response.getHeader('Set-Cookie');
  if (!current) {
    response.setHeader('Set-Cookie', cookie);
    return;
  }

  if (Array.isArray(current)) {
    response.setHeader('Set-Cookie', [...current, cookie]);
    return;
  }

  response.setHeader('Set-Cookie', [String(current), cookie]);
}

export function getRequestOrigin(request: VercelRequest) {
  const forwardedProto = request.headers['x-forwarded-proto'];
  const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  const scheme = proto || 'http';
  const host = request.headers['x-forwarded-host'] || request.headers.host || 'localhost';
  const normalizedHost = Array.isArray(host) ? host[0] : host;
  return `${scheme}://${normalizedHost}`;
}

export function getAppBaseUrl(request: VercelRequest) {
  const configured = process.env.APP_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }

  return getRequestOrigin(request).replace(/\/+$/, '');
}

export function sendError(response: VercelResponse, error: unknown) {
  if (error instanceof ApiError) {
    return sendJson(response, error.status, {
      error: error.message,
      details: error.details ?? null,
    });
  }

  const message = error instanceof Error ? error.message : 'Internal server error';
  return sendJson(response, 500, { error: message });
}

export async function withApiHandler(
  request: VercelRequest,
  response: VercelResponse,
  handler: () => Promise<unknown>
) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-secret, x-tenant-slug');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');

  if (request.method === 'OPTIONS') {
    return sendNoContent(response);
  }

  try {
    await handler();
  } catch (error) {
    sendError(response, error);
  }
}

export function assertMethod(request: VercelRequest, methods: string[]) {
  if (!request.method || !methods.includes(request.method)) {
    throw new ApiError(405, `Method ${request.method ?? 'UNKNOWN'} not allowed`);
  }
}

export async function readJsonBody<T>(request: VercelRequest): Promise<T> {
  if (request.body !== undefined && request.body !== null && request.body !== '') {
    if (typeof request.body === 'string') {
      return JSON.parse(request.body) as T;
    }

    if (Buffer.isBuffer(request.body)) {
      return JSON.parse(request.body.toString('utf-8')) as T;
    }

    return request.body as T;
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  if (!chunks.length) {
    return {} as T;
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf-8')) as T;
}

export function getCookie(request: VercelRequest, name: string) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;

  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [rawName, ...rawValue] = part.trim().split('=');
    if (rawName === name) {
      return decodeURIComponent(rawValue.join('='));
    }
  }

  return undefined;
}

export function getIdentityEmail(request: VercelRequest) {
  return getCookie(request, 'rb_user_email')?.trim().toLowerCase();
}

export function requireIdentityEmail(request: VercelRequest) {
  const email = getIdentityEmail(request);
  if (!email) {
    throw new ApiError(401, 'Identity email is required');
  }
  return email;
}

export function hasAdminAccess(request: VercelRequest) {
  const secret = request.headers['x-admin-secret'];
  const expectedSecret = getAdminApiSecret();
  if (Array.isArray(secret)) {
    if (secret.includes(expectedSecret)) return true;
  } else if (secret === expectedSecret) {
    return true;
  }

  return hasAdminSessionCookie(request) || hasTenantAdminSession(request);
}

export function requireAdminAccess(request: VercelRequest) {
  if (!hasAdminAccess(request)) {
    throw new ApiError(401, 'Admin authentication required');
  }
}

const ADMIN_SESSION_COOKIE = 'rb_admin_session';

export function createAdminSessionToken(secret: string) {
  return createHmac('sha256', secret).update('receitasbell-admin-session-v1').digest('hex');
}

export function hasAdminSessionCookie(request: VercelRequest) {
  const token = getCookie(request, ADMIN_SESSION_COOKIE);
  if (!token) return false;

  const expected = createAdminSessionToken(getAdminApiSecret());
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

function shouldUseSecureCookie(request: VercelRequest) {
  const forwardedProto = request.headers['x-forwarded-proto'];
  const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  return process.env.NODE_ENV === 'production' || proto === 'https';
}

export function setAdminSessionCookie(
  request: VercelRequest,
  response: VercelResponse,
  secret: string
) {
  const token = createAdminSessionToken(secret);
  const secure = shouldUseSecureCookie(request) ? '; Secure' : '';
  appendSetCookie(
    response,
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 12}${secure}`
  );
}

export function clearAdminSessionCookie(request: VercelRequest, response: VercelResponse) {
  const secure = shouldUseSecureCookie(request) ? '; Secure' : '';
  appendSetCookie(
    response,
    `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
  );
}

export function parseStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => String(entry).split(','))
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

export function parseBoolean(value: string | undefined, fallback = false) {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

export function requireQueryParam(request: VercelRequest, key: string) {
  const value = request.query[key];
  const normalized = Array.isArray(value) ? value[0] : value;
  if (!normalized) {
    throw new ApiError(400, `Missing query parameter: ${key}`);
  }
  return String(normalized);
}
