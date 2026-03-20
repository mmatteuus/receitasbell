import type { VercelRequest, VercelResponse } from "@vercel/node";
import { completeMercadoPagoOAuth } from "../../../src/server/mercadopago/oauth.js";
import { ApiError, assertMethod, withApiHandler } from "../../../src/server/http.js";

function buildRedirectUrl(request: VercelRequest, path: string) {
  const base = process.env.APP_BASE_URL?.trim() || `http://${request.headers.host || "localhost"}`;
  return new URL(path, base).toString();
}

function redirect(response: VercelResponse, location: string) {
  response.status(302).setHeader("Location", location).end();
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["GET"]);

    const code = Array.isArray(request.query.code) ? request.query.code[0] : request.query.code;
    const state = Array.isArray(request.query.state) ? request.query.state[0] : request.query.state;

    if (!code) {
      redirect(response, buildRedirectUrl(request, "/admin/pagamentos/configuracoes?error=mp_missing_code"));
      return;
    }

    if (!state) {
      throw new ApiError(400, "OAuth state ausente.");
    }

    try {
      const result = await completeMercadoPagoOAuth({
        code: String(code),
        state: String(state),
      });
      const separator = result.returnTo.includes("?") ? "&" : "?";
      redirect(response, buildRedirectUrl(request, `${result.returnTo}${separator}connected=1`));
    } catch (error) {
      console.error("Mercado Pago OAuth Error:", error);
      const fallback = "/admin/pagamentos/configuracoes?error=mp_oauth_failed";
      redirect(response, buildRedirectUrl(request, fallback));
    }
  });
}
