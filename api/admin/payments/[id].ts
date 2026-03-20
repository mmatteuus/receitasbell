import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasMercadoPagoAppConfig, hasMercadoPagoConfig, hasMercadoPagoWebhookSecret } from "../../../src/server/env.js";
import { getPaymentById } from "../../../src/server/sheets/paymentsRepo.js";
import { listEntitlementsByEmail } from "../../../src/server/sheets/entitlementsRepo.js";
import { getRecipeById } from "../../../src/server/sheets/recipesRepo.js";
import { getSettingsMap, mapTypedSettings } from "../../../src/server/sheets/settingsRepo.js";
import { ApiError, assertMethod, getAppBaseUrl, requireAdminAccess, sendJson, withApiHandler } from "../../../src/server/http.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["GET"]);
    requireAdminAccess(request);
    const paymentId = String(request.query.id || "");

    if (paymentId === "settings") {
      const settings = mapTypedSettings(await getSettingsMap());
      const webhookUrl = `${getAppBaseUrl(request).replace(/\/+$/, "")}/api/payments/mercadopago/webhook`;

      return sendJson(response, 200, {
        settings: {
          payment_mode: settings.payment_mode,
          webhooks_enabled: settings.webhooks_enabled,
          payment_topic_enabled: settings.payment_topic_enabled,
          accessTokenConfigured: await hasMercadoPagoConfig(),
          oauthConfigured: hasMercadoPagoAppConfig(),
          webhookSecretConfigured: hasMercadoPagoWebhookSecret(),
          userId: settings.mp_user_id || null,
          publicKey: settings.mp_public_key || null,
          webhookUrl,
        },
      });
    }

    const details = await getPaymentById(paymentId);

    if (!details) {
      throw new ApiError(404, "Payment not found");
    }

    const recipes = (
      await Promise.all(
        details.payment.recipeIds.map((recipeId) =>
          getRecipeById(recipeId, {
            includeDrafts: true,
          }),
        ),
      )
    ).filter((recipe) => Boolean(recipe));
    const entitlements = (await listEntitlementsByEmail(details.payment.payerEmail)).filter(
      (entitlement) =>
        entitlement.paymentId === details.payment.id ||
        details.payment.items.some((item) => item.slug === entitlement.recipeSlug),
    );

    return sendJson(response, 200, {
      payment: details.payment,
      recipes,
      entitlements,
      events: details.events,
      notes: details.notes,
    });
  });
}
