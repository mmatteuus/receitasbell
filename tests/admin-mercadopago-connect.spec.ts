import { expect, test } from "@playwright/test";
import { openRoute } from "./helpers";

// Este E2E é totalmente mockado para não depender do site real do Mercado Pago.
// Ele valida se a UI admin reflete readiness, bloqueios e mudança de checkout URL por modo.
test.describe("Admin pagamentos - readiness e modos", () => {
  test("exibe bloqueios, falha controlada e depois libera produção quando requisitos ficam prontos", async ({ page }) => {
    let paymentMode: "sandbox" | "production" = "sandbox";
    let productionReady = false;
    let productionAttempt = 0;

    const baseSettings = {
      siteName: "Teste",
      siteDescription: "",
      logoUrl: "",
      primaryColor: "#000000",
      secondaryColor: "#ffffff",
      accentColor: "#ff0000",
      headingFont: "Inter",
      bodyFont: "Inter",
      // home defaults
      heroBadge: "",
      heroTitle: "",
      heroSubtitle: "",
      heroImageUrl: "",
      heroPrimaryCtaLabel: "",
      heroPrimaryCtaHref: "",
      heroSecondaryCtaLabel: "",
      heroSecondaryCtaHref: "",
      featuredSectionTitle: "",
      featuredSectionSubtitle: "",
      featuredMode: "manual",
      featuredRecipeIds: [],
      featuredCategorySlug: "",
      featuredLimit: 4,
      showCategoriesGrid: true,
      showFeaturedRecipes: true,
      showPremiumSection: true,
      showRecentRecipes: true,
      showNewsletter: true,
      showTrustBar: false,
      showAboutSection: false,
      showGratinSection: false,
      trustBarItems: [],
      aboutHeadline: "",
      aboutText: "",
      aboutImageUrl: "",
      heroImageCaption: "",
      heroImageSubtitle: "",
      homeSectionsOrder: ["hero", "featured"],
      // payment
      payment_mode: paymentMode,
      webhooks_enabled: true,
      payment_topic_enabled: true,
    };

    const adminSettingsPayload = () => ({
      settings: {
        payment_mode: paymentMode,
        webhooks_enabled: true,
        payment_topic_enabled: true,
        accessTokenConfigured: true,
        oauthConfigured: true,
        webhookSecretConfigured: productionReady,
        missingConfig: [],
        connectionStatus: productionReady ? "connected" : "disconnected",
        connectedAt: productionReady ? "2026-03-01T00:00:00.000Z" : null,
        connectionExpiresAt: "2026-03-25T12:00:00.000Z",
        disconnectedAt: null,
        lastError: null,
        productionReady,
        blockingReasons: productionReady
          ? []
          : ["webhook_secret_not_configured", "mercadopago_connection_not_connected"],
        effectiveCheckoutUrlKind: productionReady && paymentMode === "production" ? "init_point" : "sandbox_init_point",
        tenantId: "tenant-1",
        userId: "user-1",
        publicKey: "pk_test",
        webhookUrl: "https://example.com/api/checkout/webhook",
      },
    });

    await page.route("**/*", async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      if (!url.includes("/api/")) {
        return route.continue();
      }

      // Session and identity
      if (url.endsWith("/api/admin/auth/session")) {
        return route.fulfill({ status: 200, body: JSON.stringify({ authenticated: true, email: "admin@example.com" }) });
      }
      if (url.endsWith("/api/auth/me")) {
        return route.fulfill({ status: 200, body: JSON.stringify({ user: { email: "admin@example.com" } }) });
      }

      // Categories/settings bootstrap
      if (url.includes("/api/public/categories")) {
        return route.fulfill({ status: 200, body: JSON.stringify({ categories: [] }) });
      }
      if (url.endsWith("/api/settings") && method === "GET") {
        return route.fulfill({ status: 200, body: JSON.stringify({ settings: baseSettings }) });
      }
      if (url.endsWith("/api/settings") && method === "PUT") {
        const bodyText = route.request().postData() || "{}";
        const body = JSON.parse(bodyText);
        const nextMode = body.settings?.payment_mode ?? paymentMode;
        if (nextMode === "production") {
          productionAttempt += 1;
          if (!productionReady && productionAttempt === 1) {
            return route.fulfill({
              status: 409,
              body: JSON.stringify({
                success: false,
                error: {
                  message: "production blocked",
                  details: { blockingReasons: ["webhook_secret_not_configured", "mercadopago_connection_not_connected"] },
                },
              }),
            });
          }
          productionReady = true;
          paymentMode = "production";
          baseSettings.payment_mode = "production";
        } else {
          paymentMode = "sandbox";
          baseSettings.payment_mode = "sandbox";
        }
        return route.fulfill({ status: 200, body: JSON.stringify({ settings: { ...baseSettings } }) });
      }

      // Admin payments settings
      if (url.endsWith("/api/admin/payments/settings")) {
        return route.fulfill({ status: 200, body: JSON.stringify(adminSettingsPayload()) });
      }

      // Connect/disconnect mocks
      if (url.endsWith("/api/admin/mercadopago/connect")) {
        return route.fulfill({ status: 200, body: JSON.stringify({ authorizationUrl: "https://mp.test/connect" }) });
      }
      if (url.endsWith("/api/admin/mercadopago/disconnect")) {
        productionReady = false;
        paymentMode = "sandbox";
        baseSettings.payment_mode = "sandbox";
        return route.fulfill({ status: 200, body: JSON.stringify({ disconnected: true, connectionStatus: "disconnected" }) });
      }

      // Default fallback
      return route.fulfill({ status: 404, body: JSON.stringify({ error: "not mocked", url }) });
    });

    await openRoute(page, "/admin/pagamentos/configuracoes");

    await expect(page.getByText("Modo Teste")).toBeVisible();
    await expect(page.getByText("Checkout URL ativa: sandbox_init_point")).toBeVisible();

    // Força troca para produção -> deve bloquear com motivos
    await page.getByRole("switch").nth(0).click(); // toggle payment_mode
    await page.getByRole("button", { name: "Salvar Configurações" }).click();
    await expect(page.getByText("Bloqueios para produção")).toBeVisible();
    await expect(page.getByText("Segredo de webhook não configurado.")).toBeVisible();

    // Agora simulamos readiness e salvamos novamente
    productionReady = true;
    await page.getByRole("button", { name: "Salvar Configurações" }).click();
    await expect(page.getByText("Checkout URL ativa: init_point")).toBeVisible();
    await expect(page.getByText("Bloqueios para produção")).toHaveCount(0);
  });
});
