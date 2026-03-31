import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json, assertMethod, ApiError, readJsonBody, getAppBaseUrl } from "../../src/server/shared/http.js";
import { supabaseAdmin } from "../../src/server/integrations/supabase/client.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withApiHandler(req, res, async ({ requestId }) => {
    assertMethod(req, ["POST"]);
    const body = await readJsonBody<{ email?: string; redirectTo?: string }>(req);
    const { email, redirectTo } = body || {};

    if (!email) {
      throw new ApiError(400, "O e-mail é obrigatório para recuperação.");
    }

    const appUrl = getAppBaseUrl(req);
    const destination = redirectTo || `${appUrl}/recuperar-senha`;

    // Supabase Auth enviará o e-mail de recuperação
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: destination,
    });

    if (error) {
      throw new ApiError(400, error.message);
    }

    return json(res, 200, {
      success: true,
      data: { ok: true, message: "Instruções enviadas para o seu e-mail." },
      requestId,
    });
  });
}
