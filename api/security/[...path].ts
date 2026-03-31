import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendNotFound } from '../../src/server/shared/http.js';

import cspReport from '../../api_handlers/security/csp-report.js';

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

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const key = readPath(request, '/api/security/').join('/');

  if (key !== 'csp-report') {
    return sendNotFound(request, response);
  }

  await cspReport(request, response);
}
