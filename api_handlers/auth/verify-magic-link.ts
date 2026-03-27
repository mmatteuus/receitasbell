import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json, assertMethod, ApiError, readJsonBody } from "../../src/server/shared/http.js";
import { consumeMagicLink } from "../../src/server/auth/magicLinks.js";
import { createSession } from "../../src/server/auth/sessions.js";
import { findOrCreateUserByEmail } from "../../src/server/identity/repo.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withApiHandler(req, res, async ({ requestId }) => {
    assertMethod(req, ["POST"]);
    const body = await readJsonBody<{ tenantId?: string | number; token?: string }>(req);
    const tenantId = body?.tenantId;
    const token = body?.token;
    if (!tenantId || !token) throw new ApiError(400, "tenantId e token obrigat\u00f3rios");

    const consumed = await consumeMagicLink({ tenantId: String(tenantId), token: String(token), purpose: "user" });
    if (!consumed) return json(res, 410, { success: false, error: { message: "Token inv\u00e1lido ou expirado" }, requestId });

    // Buscar ou criar usu\u00e1rio pelo e-mail NO SERVIDOR - n\u00e3o confiar no userId do cliente
    const user = await findOrCreateUserByEmail(String(tenantId), consumed.email);

    const role = user.role === "admin" || user.role === "owner" ? user.role : "user";
    await createSession(req, res, {
      tenantId: String(tenantId),
      userId: String(user.id),
      email: consumed.email,
      role,
    });

    return json(res, 200, { success: true, data: { ok: true, redirectTo: consumed.redirectTo }, requestId });
  });
}
