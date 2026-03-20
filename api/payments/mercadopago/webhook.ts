import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasMercadoPagoWebhookSecret } from "../../../src/server/env.js";
import { getSettingsMap, mapTypedSettings } from "../../../src/server/sheets/settingsRepo.js";
import { processMercadoPagoWebhook } from "../../../src/server/mercadopago/webhooks.js";
import { ApiError, assertMethod, readJsonBody, sendJson, withApiHandler } from "../../../src/server/http.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["POST"]);

    const settings = mapTypedSettings(await getSettingsMap());
    if (!settings.webhooks_enabled) {
      throw new ApiError(503, "Mercado Pago webhook processing is disabled");
    }

    if (!hasMercadoPagoWebhookSecret()) {
      throw new ApiError(501, "MP_WEBHOOK_SECRET is not configured");
    }

    const payload = await readJsonBody<Record<string, unknown>>(request);
    const result = await processMercadoPagoWebhook(request, payload);
    return sendJson(response, 202, result);
  });
}
