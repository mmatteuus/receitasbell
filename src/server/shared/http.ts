import type { VercelRequest, VercelResponse } from '@vercel/node';
import { env } from './env.js';
import { Logger } from './logger.js';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function assertMethod(request: VercelRequest, methods: string[]) {
  if (!methods.includes(request.method ?? '')) {
    throw new ApiError(405, `Method ${request.method} not allowed`);
  }
}

export function requireCronAuth(request: VercelRequest) {
  const authHeader = request.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    throw new ApiError(401, 'Unauthorized');
  }
}

export function sendJson(response: VercelResponse, status: number, body: unknown) {
  response.status(status).json(body);
}

export function requireQueryParam(request: VercelRequest, name: string): string {
  const value = request.query[name];
  if (!value || typeof value !== 'string') {
    throw new ApiError(400, `Missing required query parameter: ${name}`);
  }
  return value;
}

export async function readJsonBody<T>(request: VercelRequest): Promise<T> {
  if (request.body && typeof request.body === 'object' && !Array.isArray(request.body)) {
    return request.body as T;
  }
  // If not already parsed by Vercel
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body) as T);
      } catch (err) {
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

export function getQueryValue(value: string | string[] | undefined): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0];
  return value;
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

export async function withApiHandler(
  request: VercelRequest,
  response: VercelResponse,
  handler: (logger: Logger) => Promise<void | unknown> | void | unknown,
) {
  const logger = new Logger({ 
    path: request.url, 
    method: request.method,
    requestId: request.headers['x-vercel-id'] as string || crypto.randomUUID()
  });

  try {
    await handler(logger);
  } catch (error: any) {
    if (error instanceof ApiError) {
      return sendJson(response, error.status, {
        error: {
          message: error.message,
          details: error.details ?? null,
        },
      });
    }

    logger.error('[API Error]', error);
    return sendJson(response, 500, {
      error: {
        message: 'Internal server error',
      },
    });
  }
}
