import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';

function readHeaderValue(value: string | string[] | undefined) {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) {
    return value[0].trim();
  }
  return null;
}

export function getCorrelationId(request: VercelRequest) {
  return (
    readHeaderValue(request.headers['x-correlation-id']) ||
    readHeaderValue(request.headers['x-request-id']) ||
    readHeaderValue(request.headers['x-vercel-id']) ||
    crypto.randomUUID()
  );
}

export function applyCorrelationId(response: VercelResponse, correlationId: string) {
  response.setHeader('x-correlation-id', correlationId);
  response.setHeader('x-request-id', correlationId);
  return correlationId;
}
