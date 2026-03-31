import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendNotFound } from '../../src/server/shared/http.js';

import authLogout from '../../api_handlers/auth/logout.js';
import authMe from '../../api_handlers/auth/me.js';
import authRequestMagicLink from '../../api_handlers/auth/request-magic-link.js';
import authVerifyMagicLink from '../../api_handlers/auth/verify-magic-link.js';
import authOAuthStart from '../../api_handlers/auth/oauth-start.js';
import authOAuthCallback from '../../api_handlers/auth/oauth-callback.js';
import authLoginPassword from '../../api_handlers/auth/login-password.js';
import authSignupPassword from '../../api_handlers/auth/signup-password.js';
import authResetPassword from '../../api_handlers/auth/reset-password.js';

type RouteHandler = (
  request: VercelRequest,
  response: VercelResponse
) => Promise<unknown> | unknown;

function readPath(request: VercelRequest, prefix: string): string[] {
  const value = request.query.path;
  if (Array.isArray(value) && value.length > 0) {
    return value.map((part) => String(part).trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.length > 0) {
    return value
      .split('/')
      .map((part) => part.trim())
      .filter(Boolean);
  }

  const pathname = (request.url || '').split('?')[0] || '';
  if (!pathname.startsWith(prefix)) return [];

  return pathname
    .slice(prefix.length)
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);
}

const routes: Record<string, RouteHandler> = {
  logout: authLogout,
  me: authMe,
  request: authRequestMagicLink,
  'request-magic-link': authRequestMagicLink,
  verify: authVerifyMagicLink,
  'verify-magic-link': authVerifyMagicLink,
  'oauth/start': authOAuthStart,
  'oauth/callback': authOAuthCallback,
  'login-password': authLoginPassword,
  'signup-password': authSignupPassword,
  'reset-password': authResetPassword,
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const key = readPath(request, '/api/auth/').join('/');
  const target = routes[key];

  if (!target) {
    return sendNotFound(request, response);
  }

  await target(request, response);
}
