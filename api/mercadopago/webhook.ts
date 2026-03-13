import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasMercadoPagoConfig } from "../../src/server/env.js";
import { ApiError, assertMethod, readJsonBody, sendJson, withApiHandler } from "../../src/server/http.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["POST"]);

    if (!hasMercadoPagoConfig()) {
      throw new ApiError(501, "Mercado Pago webhook is not enabled in this environment");
    }

    const payload = await readJsonBody<Record<string, unknown>>(request);
    return sendJson(response, 202, {
      received: true,
      message: "Mercado Pago webhook support is enabled but not fully configured in this environment.",
      payload,
    });
  });
}
