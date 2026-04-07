import type { VercelRequest, VercelResponse } from '@vercel/node';
import { STATUS_CODES } from 'node:http';
import { env } from './env.js';
import { applyCorrelationId, getCorrelationId } from './correlation.js';
import { problemDetail } from './errors.js';
import { Logger } from './logger.js';
import { checkSLO } from './slo.js';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function assertMethod(req: VercelRequest, allowed: string[]) {
  const m = (req.method ?? 'GET').toUpperCase();
  if (!allowed.includes(m)) throw new ApiError(405, `Method ${m} not allowed`);
}

export function requireCronAuth(req: VercelRequest) {
  const auth = req.headers.authorization;
  if (auth === `Bearer ${env.CRON_SECRET}`) return;
  const querySecret = getQueryValue(req, 'secret');
  if (querySecret && querySecret === env.CRON_SECRET) return;
  throw new ApiError(401, 'Unauthorized');
}

export function noStore(res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
}

export function setPublicCache(
  res: VercelResponse,
  seconds: number,
  staleWhileRevalidate?: number
) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const swr = Math.max(0, Math.floor(staleWhileRevalidate ?? Math.floor(safeSeconds / 2)));
  res.setHeader('Cache-Control', `public, s-maxage=${safeSeconds}, stale-while-revalidate=${swr}`);
}

export function json(res: VercelResponse, status: number, body: unknown) {
  if (!res.getHeader('Cache-Control')) {
    noStore(res);
  }
  res.status(status).json(body);
}

export function sendJson(res: VercelResponse, status: number, body: unknown) {
  return json(res, status, body);
}

export function requestId(req: VercelRequest) {
  return getCorrelationId(req);
}

function buildProblemInstance(req: VercelRequest) {
  return (req.url || '/').split('?')[0] || '/';
}

export function sendProblem(
  res: VercelResponse,
  status: number,
  title: string,
  detail: string,
  options: { instance?: string; requestId?: string; type?: string; details?: unknown } = {}
) {
  // Sempre define no-store em erros para evitar cache de falhas (como 401/500/404)
  noStore(res);

  res.setHeader('Content-Type', 'application/problem+json');
  return res.status(status).json(
    problemDetail({
      status,
      title,
      detail,
      instance: options.instance,
      requestId: options.requestId,
      type: options.type,
      details: options.details,
    })
  );
}

export function sendNotFound(
  req: VercelRequest,
  res: VercelResponse,
  detail = 'Endpoint nao encontrado.'
) {
  const rid = requestId(req);
  applyCorrelationId(res, rid);
  return sendProblem(res, 404, 'Not Found', detail, {
    instance: buildProblemInstance(req),
    requestId: rid,
  });
}

function getHeaderValue(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value) && value.length) {
    const first = value[0];
    if (typeof first === 'string' && first.trim()) return first.trim();
  }
  return undefined;
}

export function getClientAddress(req: VercelRequest) {
  const xff = getHeaderValue(req.headers['x-forwarded-for']);
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return (
    getHeaderValue(req.headers['x-real-ip']) ||
    getHeaderValue(req.headers['x-vercel-forwarded-for']) ||
    'unknown'
  );
}

export function getRequestOrigin(req: VercelRequest) {
  const forwardedHost = getHeaderValue(req.headers['x-forwarded-host']);
  const host = forwardedHost || getHeaderValue(req.headers.host) || 'localhost';
  const proto = getHeaderValue(req.headers['x-forwarded-proto']) || 'http';
  return `${proto}://${host}`;
}

export function getAppBaseUrl(req: VercelRequest) {
  return (env.APP_BASE_URL || '').replace(/\/+$/, '') || getRequestOrigin(req);
}

export function getQueryValue(req: VercelRequest, key: string): string | null {
  const fromQuery = req.query?.[key];
  if (typeof fromQuery === 'string') return fromQuery;
  if (Array.isArray(fromQuery) && fromQuery.length) {
    const first = fromQuery[0];
    return typeof first === 'string' ? first : null;
  }

  try {
    const url = new URL(req.url || '/', getRequestOrigin(req));
    return url.searchParams.get(key);
  } catch {
    return null;
  }
}

export async function buffer(readable: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function readJsonBody<T>(req: VercelRequest): Promise<T> {
  // 1. Se já for um objeto (Vercel bodyParser ligado)
  if (
    req.body &&
    typeof req.body === 'object' &&
    !Buffer.isBuffer(req.body) &&
    typeof (req as unknown as { on?: unknown }).on !== 'function'
  ) {
    return req.body as T;
  }

  // 2. Se for uma string (já lida mas não parseada)
  if (typeof req.body === 'string') {
    if (!req.body.trim()) return {} as T;
    try {
      return JSON.parse(req.body) as T;
    } catch {
      return {} as T;
    }
  }

  // 3. Se for um stream (bodyParser: false)
  if (!req.body && typeof (req as unknown as { on?: unknown }).on === 'function') {
    try {
      const buf = await buffer(req);
      if (buf.length === 0) return {} as T;
      return JSON.parse(buf.toString()) as T;
    } catch {
      return {} as T;
    }
  }

  if (req.body == null) return {} as T;
  return req.body as T;
}

export function withApiHandler<T = void>(
  handler: (
    req: VercelRequest,
    res: VercelResponse,
    ctx: { requestId: string; logger: Logger }
  ) => Promise<T>
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const start = Date.now();
    const rid = requestId(req);
    const logger = Logger.fromRequest(req, { requestId: rid, correlationId: rid });
    applyCorrelationId(res, rid);

    let status = 200; // default success status

    try {
      await handler(req, res, { requestId: rid, logger });

      // O handler pode não ter chamado res.status(X). Se chamou, pegamos o valor correto.
      status = res.statusCode || 200;
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        status = error.status;
        const errorContext = {
          status: error.status,
          message: error.message,
          details: error.details ?? null,
        };

        if (error.status >= 500) {
          logger.withContext(errorContext).error('API error', error);
        } else {
          logger.warn('API error', errorContext);
        }

        sendProblem(
          res,
          error.status,
          String(STATUS_CODES[error.status] ?? 'API Error'),
          error.message,
          {
            instance: buildProblemInstance(req),
            requestId: rid,
            details: error.details ?? undefined,
          }
        );
      } else {
        status = 500;
        logger.error('Unhandled API error', error);
        sendProblem(
          res,
          500,
          String(STATUS_CODES[500] ?? 'Internal Server Error'),
          'Internal server error',
          {
            instance: buildProblemInstance(req),
            requestId: rid,
          }
        );
      }
    } finally {
      const durationMs = Date.now() - start;
      const metrics = checkSLO(durationMs, status);

      if (metrics.breached) {
        const sloLog = {
          durationMs,
          status,
          type: metrics.type,
          slo_breach: true,
          critical: metrics.critical,
        };

        if (metrics.critical) {
          logger.error(`SLO Critical Breach: ${metrics.type}`, sloLog);
        } else {
          logger.warn(`SLO Target Breach: ${metrics.type}`, sloLog);
        }
      } else {
        // Log incidental metrics for successful P95 tracking downstream (logs parser like Sentry or Cloudwatch)
        if (durationMs > 100) { // log only if non-trivial for noise reduction
          logger.debug('Request Performance Metrics', { durationMs, status });
        }
      }
    }
  };
}
