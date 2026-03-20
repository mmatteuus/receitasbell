import type { VercelRequest, VercelResponse } from "@vercel/node";
import { startMercadoPagoLoginFlow } from "../../../src/server/admin/auth/mp-login.js";
import { sendError } from "../../../src/server/http.js";

/**
 * GET /api/admin/auth/mp-login
 * Redireciona o usuário para o Mercado Pago para autenticação.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const returnTo = req.query.returnTo as string | undefined;
    const { authorizationUrl } = await startMercadoPagoLoginFlow({ returnTo });
    
    // Redireciona para o Mercado Pago
    return res.redirect(authorizationUrl);
  } catch (error) {
    return sendError(res, error);
  }
}
