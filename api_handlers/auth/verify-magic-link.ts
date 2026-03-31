import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json, assertMethod, ApiError, readJsonBody } from "../../src/server/shared/http.js";
import { consumeMagicLink } from "../../src/server/auth/magicLinks.js";
import { createSession } from "../../src/server/auth/sessions.js";
import { findOrCreateUserByEmail } from "../../src/server/identity/repo.js";
import { requireTenantFromRequest } from "../../src/server/tenancy/resolver.js";

export default withApiHandler(async (req, res, { requestId }) => {
  assertMethod(req, ["POST"]);
  const { tenant } = await requireTenantFromRequest(req);
  const body = await readJsonBody<{ token?: string }>(req);
  const token = body?.token;
  if (!token) throw new ApiError(400, "token obrigatório");

  const consumed = await consumeMagicLink({
    tenantId: String(tenant.id),
    token: String(token),
    purpose: "user",
  });
  if (!consumed) return json(res, 410, { success: false, error: { message: "Token inválido ou expirado" }, requestId });

  // Buscar ou criar usuário pelo e-mail NO SERVIDOR - não confiar no userId do cliente
  const user = await findOrCreateUserByEmail(String(tenant.id), consumed.email);

  const role = user.role === "admin" || user.role === "owner" ? user.role : "user";
  await createSession(req, res, {
    tenantId: String(tenant.id),
    userId: String(user.id),
    email: consumed.email,
    role,
  });

  return json(res, 200, {
    success: true,
    data: {
      ok: true,
      redirectTo: consumed.redirectTo || "/pwa/app",
      tenantSlug: tenant.slug,
    },
    requestId,
  });
});
