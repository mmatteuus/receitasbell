import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendNotFound } from '../../src/server/shared/http.js';

import jobCleanup from '../../api_handlers/jobs/cleanup.js';
import jobConsistency from '../../api_handlers/jobs/consistency.js';

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
  cleanup: jobCleanup,
  consistency: jobConsistency,
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const key = readPath(request, '/api/jobs/').join('/');
  const target = routes[key];

  if (!target) {
    return sendNotFound(request, response);
  }

  await target(request, response);
}
