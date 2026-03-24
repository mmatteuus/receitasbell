import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json, assertMethod } from "../../src/server/shared/http.js";
import { consumeMagicLink } from "../../src/server/auth/magicLinks.js";
import { createSession } from "../../src/server/auth/sessions.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withApiHandler(req, res, async ({ requestId }) => {
    assertMethod(req, ["POST"]);
    const { tenantId, token, userId } = req.body as any;

    const consumed = await consumeMagicLink({ tenantId: String(tenantId), token: String(token), purpose: "user" });
    if (!consumed) return json(res, 410, { success: false, error: { message: "Invalid or expired token" }, requestId });

    // Neste projeto, userId pode ser criado/obtido via Baserow users table.
    // Se não existir, o agente deve implementar findOrCreateUserByEmail na Fase 4.
    await createSession(req, res, { tenantId: String(tenantId), userId: String(userId), email: consumed.email, role: "user" });

    return json(res, 200, { success: true, data: { ok: true, redirectTo: consumed.redirectTo }, requestId });
  });
}
