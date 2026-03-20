import { createMercadoPagoOAuthStart } from "../../mercadopago/oauth.js";
import { ApiError } from "../../http.js";

/**
 * Inicia o fluxo de login via Mercado Pago.
 * Não exige autenticação prévia pois é usado no onboarding.
 */
export async function startMercadoPagoLoginFlow(input: {
  returnTo?: string | null;
}) {
  // Iniciamos o OAuth com tenantId "system" para indicar que é um login/onboarding
  return createMercadoPagoOAuthStart({
    tenantId: "system",
    tenantUserId: "system",
    returnTo: input.returnTo || "/admin",
    mode: "login",
  });
}
