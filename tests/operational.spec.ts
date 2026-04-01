import { expect, test } from '@playwright/test';

const tenantSlug = process.env.PLAYWRIGHT_TENANT_SLUG;

test.describe('ReceitasBell Operational & Security', () => {
  test('Health Check - Live endpoint deve responder 200', async ({ request }) => {
    const response = await request.get('/api/health/live');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe('live');
  });

  test('Health Check - Ready endpoint deve responder 200 ou 503', async ({ request }) => {
    const response = await request.get('/api/health/ready');
    expect([200, 503]).toContain(response.status());
    const body = await response.json();
    expect(body.status).toMatch(/ready|degraded|unavailable/);
    expect(body.checks).toBeDefined();
    expect(body.checks.env).toBeDefined();
    expect(body.checks.rateLimit).toBeDefined();
  });

  test('Cron Jobs - Acesso sem Secret deve retornar 401', async ({ request }) => {
    const jobs = ['cleanup', 'consistency'];

    for (const job of jobs) {
      const response = await request.get(`/api/jobs/${job}`);
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toMatch(/Unauthorized/i);
    }
  });

  test('Cron Jobs - Acesso com Secret incorreta deve retornar 401', async ({ request }) => {
    const response = await request.get('/api/jobs/cleanup?secret=wrong-secret');
    expect(response.status()).toBe(401);
  });

  test('Headers de Segurança e Cache - Admin não deve ser cacheado', async ({ request }) => {
    const headers: Record<string, string> = {};
    if (tenantSlug) headers['X-Tenant-Slug'] = tenantSlug;

    const response = await request.get('/api/admin/settings', { headers });
    // Mesmo sem auth (401/403), o erro não deve ser cacheado
    expect(response.headers()['cache-control']).toMatch(/no-store/);
  });

  test('Headers de Segurança e Cache - Catálogo público deve ter cache', async ({ request }) => {
    const response = await request.get('/api/public/catalog');
    if (response.ok()) {
      expect(response.headers()['cache-control']).toMatch(/public|max-age/);
    }
  });
});
