import { expect, test } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BOOTSTRAP_URL || "http://localhost:3000";

test.describe("Operational Excellence (Phase 5) Smoke Tests", () => {
  
  test("Health check summary responds correctly", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/health`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.services.database).toBe('OK');
  });

  test("Liveness probe responds 200", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/health/live`);
    expect(res.status()).toBe(200);
  });

  test("Readiness probe validates database", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/health/ready`);
    expect(res.status()).toBe(200);
  });

  test("Jobs require CRON_SECRET authorization", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/jobs/reconcile`);
    expect(res.status()).toBe(401);
  });

  test("Public catalog has Cache-Control headers", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/public/catalog`);
    expect(res.headers()['cache-control']).toContain('public');
    expect(res.headers()['cache-control']).toContain('s-maxage=');
  });

  test("Admin routes have no-cache headers", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/auth`);
    // Should return 401 but with no-cache (default in sendJson)
    expect(res.headers()['cache-control']).toContain('no-store');
  });

});
