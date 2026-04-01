import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

describe('session fallback', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('createSession falls back to a signed cookie when the sessions table returns 404', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: 'not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const setHeader = vi.fn();
    const { createSession, getSession } = await import('../src/server/auth/sessions.js');

    await createSession(
      {
        headers: {
          'x-forwarded-for': '127.0.0.1',
          'user-agent': 'vitest',
        },
      } as unknown as VercelRequest,
      { setHeader } as unknown as VercelResponse,
      {
        tenantId: 'tenant-1',
        userId: 'user-1',
        email: 'admin@example.com',
        role: 'owner',
      }
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const cookieHeader = String(setHeader.mock.calls.at(-1)?.[1] || '');
    expect(cookieHeader).toContain('rb_session=rb1.');

    const cookieValue = cookieHeader.match(/rb_session=([^;]+)/)?.[1];
    expect(cookieValue).toBeTruthy();

    const session = await getSession({
      headers: { cookie: `rb_session=${cookieValue}` },
    } as unknown as VercelRequest);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(session).toEqual({
      tenantId: 'tenant-1',
      userId: 'user-1',
      email: 'admin@example.com',
      role: 'owner',
    });
  }, 10000);
});
