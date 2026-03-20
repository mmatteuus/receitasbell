import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasMercadoPagoWebhookSecret } from "../../../src/server/env.js";
import { createTenantMercadoPagoCheckout, createTenantMockCheckout } from "../../../src/server/mercadopago/payments.js";
import { getSettingsMap, mapTypedSettings } from "../../../src/server/sheets/settingsRepo.js";
import { requireTenantFromRequest } from "../../../src/server/tenants/resolver.js";
import { checkoutSchema } from "../../../src/server/validators.js";
import {
  ApiError,
  assertMethod,
  getAppBaseUrl,
  readJsonBody,
  sendJson,
  withApiHandler,
} from "../../../src/server/http.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["POST"]);
    const body = checkoutSchema.parse(await readJsonBody(request));
    const resolved = await requireTenantFromRequest(request);
    const buyerEmail = body.buyerEmail.trim().toLowerCase();
    const settings = mapTypedSettings(await getSettingsMap());

    const checkoutInput = {
      tenantId: resolved.tenant.id,
      recipeIds: body.recipeIds,
      items: body.items,
      payerName: body.payerName,
      buyerEmail,
      checkoutReference: body.checkoutReference,
    };

    const result =
      settings.payment_mode === "production"
        ? await (async () => {
            if (!settings.webhooks_enabled) {
              throw new ApiError(409, "Ative os webhooks para usar o checkout real do Mercado Pago.");
            }

            if (!settings.payment_topic_enabled) {
              throw new ApiError(409, "Ative o topico payment antes de habilitar o checkout real.");
            }

            if (!hasMercadoPagoWebhookSecret()) {
              throw new ApiError(501, "Configure MP_WEBHOOK_SECRET na Vercel para habilitar pagamentos reais.");
            }

            return createTenantMercadoPagoCheckout({
              ...checkoutInput,
              baseUrl: getAppBaseUrl(request),
              publicBasePath: resolved.publicBasePath,
              enableNotifications: settings.webhooks_enabled && settings.payment_topic_enabled,
            });
          })()
        : await createTenantMockCheckout(checkoutInput);

    return sendJson(response, 201, result);
  });
}
