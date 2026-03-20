import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasMercadoPagoConfig } from "../../../src/server/env.js";
import { findOrCreateUserByEmail } from "../../../src/server/sheets/usersRepo.js";
import { createMercadoPagoCheckout, createMockCheckout } from "../../../src/server/sheets/paymentsRepo.js";
import { getSettingsMap, mapTypedSettings } from "../../../src/server/sheets/settingsRepo.js";
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
    const buyerEmail = body.buyerEmail.trim().toLowerCase();
    const settings = mapTypedSettings(await getSettingsMap());
    const user = await findOrCreateUserByEmail(buyerEmail);

    const checkoutInput = {
      recipeIds: body.recipeIds,
      items: body.items,
      payerName: body.payerName,
      buyerEmail,
      userId: user.id,
      checkoutReference: body.checkoutReference,
    };

    const result =
      settings.payment_mode === "production"
        ? await (async () => {
            if (!(await hasMercadoPagoConfig())) {
              throw new ApiError(501, "Mercado Pago is not configured for production checkout");
            }

            if (!settings.webhooks_enabled) {
              throw new ApiError(409, "Ative os webhooks para usar o checkout real do Mercado Pago.");
            }

            if (!settings.payment_topic_enabled) {
              throw new ApiError(409, "Ative o topico payment antes de habilitar o checkout real.");
            }

            return createMercadoPagoCheckout({
              ...checkoutInput,
              baseUrl: getAppBaseUrl(request),
              enableNotifications: settings.webhooks_enabled && settings.payment_topic_enabled,
            });
          })()
        : await createMockCheckout(checkoutInput);

    return sendJson(response, 201, result);
  });
}
