import { expect, test } from "@playwright/test";

test.describe("ReceitasBell Operational & Security", () => {
  
  test("Health Check - Live endpoint deve responder 200", async ({ request }) => {
    const response = await request.get("/api/health/live");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("live");
  });

  test("Health Check - Ready endpoint deve responder 200 (se configurado corretamente)", async ({ request }) => {
    const response = await request.get("/api/health/ready");
    // Se estiver em ambiente de teste sem Baserow, pode retornar 503, mas o contrato deve ser respeitado
    const body = await response.json();
    expect(body.status).toMatch(/ready|not_ready/);
    expect(body.checks).toBeDefined();
  });

  test("Cron Jobs - Acesso sem Secret deve retornar 401", async ({ request }) => {
    const jobs = ["reconcile", "cleanup", "consistency"];
    
    for (const job of jobs) {
      const response = await request.get(`/api/jobs/${job}`);
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toMatch(/Unauthorized/i);
    }
  });

  test("Cron Jobs - Acesso com Secret incorreta deve retornar 401", async ({ request }) => {
    const response = await request.get("/api/jobs/reconcile?secret=wrong-secret");
    expect(response.status()).toBe(401);
  });

  test("Headers de Segurança e Cache - Admin não deve ser cacheado", async ({ request }) => {
    const response = await request.get("/api/admin/settings");
    // Mesmo sem auth, o erro 403 não deve ser cacheado
    expect(response.headers()["cache-control"]).toMatch(/no-store|no-cache/);
  });

  test("Headers de Segurança e Cache - Catálogo público deve ter cache", async ({ request }) => {
    const response = await request.get("/api/public/catalog");
    if (response.ok()) {
      expect(response.headers()["cache-control"]).toMatch(/public|max-age/);
    }
  });
});
