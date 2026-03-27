import type { VercelRequest, VercelResponse } from "@vercel/node";

function appendQuery(path: string, key: string, value: string) {
  const url = new URL(path, "http://localhost");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const fallback = "/admin/pagamentos/configuracoes";

  try {
    const url = new URL(request.url || "", "http://localhost");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) {
      response.redirect(302, appendQuery(fallback, "error", "mp_oauth_failed"));
      return;
    }

    const { handleMercadoPagoOAuthCallback } = await import("../../src/server/integrations/mercadopago/oauth.js");
    const { returnTo } = await handleMercadoPagoOAuthCallback(code, state);
    const safePath = returnTo && returnTo.startsWith("/") ? returnTo : fallback;

    response.redirect(302, appendQuery(safePath, "connected", "1"));
  } catch {
    response.redirect(302, appendQuery(fallback, "error", "mp_oauth_failed"));
  }
}
