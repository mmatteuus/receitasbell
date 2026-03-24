import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';
import { env } from './env.js';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function getRequestId(req: VercelRequest): string {
  // prefer um id existente se houver, senão gera
  const incoming = req.headers['x-request-id'] || req.headers['x-vercel-id'];
  if (typeof incoming === 'string' && incoming.trim()) return incoming;
  return crypto.randomUUID();
}

export function assertMethod(req: VercelRequest, allowed: string[]) {
  const m = (req.method ?? 'GET').toUpperCase();
  if (!allowed.includes(m)) throw new ApiError(405, `Method ${m} not allowed`);
}

export function requireCronAuth(req: VercelRequest) {
  // Vercel envia Authorization automaticamente quando CRON_SECRET existe
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${env.CRON_SECRET}`) throw new ApiError(401, 'Unauthorized');
}

export function noStore(res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
}

export function json(res: VercelResponse, status: number, body: unknown) {
  noStore(res);
  res.status(status).json(body);
}

export async function readJsonBody<T>(req: VercelRequest): Promise<T> {
  if (req.body) return req.body;
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new ApiError(400, 'Invalid JSON body'));
      }
    });
  });
}

export function getAppBaseUrl(request: VercelRequest): string {
  const host = request.headers.host;
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

export function getClientAddress(request: VercelRequest): string {
  const forwarded = request.headers['x-forwarded-for'];
  if (Array.isArray(forwarded)) {
    return forwarded[0]?.split(',')[0]?.trim() || 'unknown';
  }
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return request.socket.remoteAddress || 'unknown';
}

export function setPublicCache(res: VercelResponse, seconds: number) {
  res.setHeader('Cache-Control', `public, s-maxage=${seconds}, stale-while-revalidate`);
}

export function getQueryValue(value: string | string[] | undefined): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0];
  return value;
}

export async function withApiHandler(
  req: VercelRequest,
  res: VercelResponse,
  fn: (ctx: { requestId: string }) => Promise<void>,
) {
  const requestId = getRequestId(req);
  res.setHeader('x-request-id', requestId);

  try {
    await fn({ requestId });
  } catch (err) {
    if (err instanceof ApiError) {
      return json(res, err.status, { success: false, error: { message: err.message, details: err.details ?? null }, requestId });
    }
    console.error(`[API ERROR] ${requestId}:`, err);
    return json(res, 500, { success: false, error: { message: 'Internal server error' }, requestId });
  }
}
