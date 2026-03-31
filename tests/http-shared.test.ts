import { describe, expect, test } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getQueryValue,
  json,
  readJsonBody,
  requestId,
  sendProblem,
  setPublicCache,
} from '../src/server/shared/http.js';

function createResponseMock() {
  const headers = new Map<string, string>();
  return {
    headers,
    statusCode: 200,
    payload: undefined as unknown,
    setHeader(name: string, value: string) {
      headers.set(name.toLowerCase(), String(value));
    },
    getHeader(name: string) {
      return headers.get(name.toLowerCase());
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.payload = body;
      return this;
    },
  };
}

describe('shared/http helpers', () => {
  test('json nao sobrescreve cache-control quando ja definido', () => {
    const res = createResponseMock();
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    json(res as unknown as VercelResponse, 200, { ok: true });
    expect(res.getHeader('Cache-Control')).toBe('public, s-maxage=300');
  });

  test('setPublicCache configura cache publico do edge', () => {
    const res = createResponseMock();
    setPublicCache(res as unknown as VercelResponse, 600);
    expect(res.getHeader('Cache-Control')).toContain('public');
    expect(res.getHeader('Cache-Control')).toContain('s-maxage=600');
  });

  test('getQueryValue le de req.query e fallback de URL', () => {
    const fromQuery = getQueryValue(
      { query: { slug: 'bolo' }, headers: {}, url: '/x' } as unknown as VercelRequest,
      'slug'
    );
    expect(fromQuery).toBe('bolo');

    const fromUrl = getQueryValue(
      {
        query: {},
        headers: { host: 'localhost' },
        url: '/x?slug=torta',
      } as unknown as VercelRequest,
      'slug'
    );
    expect(fromUrl).toBe('torta');
  });

  test('readJsonBody parseia string json', async () => {
    const body = await readJsonBody<{ foo: string }>({
      body: '{"foo":"bar"}',
    } as unknown as VercelRequest);
    expect(body.foo).toBe('bar');
  });

  test('requestId prioriza correlation id recebido', () => {
    const value = requestId({
      headers: {
        'x-correlation-id': 'corr-123',
        'x-request-id': 'req-456',
      },
    } as unknown as VercelRequest);

    expect(value).toBe('corr-123');
  });

  test('sendProblem responde com problem+json e request_id', () => {
    const res = createResponseMock();
    sendProblem(res as unknown as VercelResponse, 409, 'Conflict', 'Conflito detectado', {
      requestId: 'req-123',
      instance: '/api/test',
      details: { reason: 'stale_version' },
    });

    expect(res.statusCode).toBe(409);
    expect(res.getHeader('Content-Type')).toBe('application/problem+json');
    expect(res.payload).toMatchObject({
      title: 'Conflict',
      detail: 'Conflito detectado',
      status: 409,
      request_id: 'req-123',
      instance: '/api/test',
      details: { reason: 'stale_version' },
    });
  });
});
