import type { VercelRequest } from '@vercel/node';
import crypto from 'node:crypto';
import { ApiError, getRequestOrigin } from '../shared/http.js';

export const CSRF_COOKIE = '__Host-rb_csrf';

export function newCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
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

function normalizeOrigin(input: string) {
  try {
    const url = new URL(input);
    return `${url.protocol}//${url.host}`.toLowerCase();
  } catch {
    return "";
  }
}

// double-submit: header deve bater com cookie
export function requireCsrf(req: VercelRequest) {
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[CSRF_COOKIE];
  const headerToken = req.headers['x-csrf-token'];
  if (!cookieToken || typeof headerToken !== 'string' || headerToken !== cookieToken) {
    throw new ApiError(403, 'CSRF validation failed');
  }
}

export function requireSameOriginIfPresent(req: VercelRequest) {
  const origin = req.headers.origin;
  if (typeof origin !== "string" || !origin.trim()) {
    return;
  }

  const expected = normalizeOrigin(getRequestOrigin(req));
  const received = normalizeOrigin(origin);
  if (!expected || !received || expected !== received) {
    throw new ApiError(403, "Origin validation failed");
  }
}
