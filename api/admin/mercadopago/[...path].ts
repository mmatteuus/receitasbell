import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireTenantAdminAccess } from "../../../src/server/admin/tenantAccess.js";
import { getTenantAdminPaymentSettings } from "../../../src/server/admin/payments.js";
import { assertMethod, readJsonBody, sendJson, withApiHandler } from "../../../src/server/http.js";
import {
  createMercadoPagoOAuthStart,
  // complete handled in /api/mercadopago/oauth/callback
} from "../../../src/server/mercadopago/oauth.js";
import { disconnectTenantMercadoPagoConnection } from "../../../src/server/mercadopago/connections.js";

function getPathSegments(request: VercelRequest) {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const segments = url.pathname.split("/").filter(Boolean);
  const idx = segments.indexOf("mercadopago");
  return idx >= 0 ? segments.slice(idx + 1) : [];
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const access = await requireTenantAdminAccess(request);
    const segments = getPathSegments(request);
    const action = segments[0] || "";

    if (action === "connect") {
      assertMethod(request, ["POST"]);
      const body = await readJsonBody<{ returnTo?: string | null }>(request);
      const oauth = await createMercadoPagoOAuthStart({
        tenantId: access.tenant.id,
        tenantUserId: access.tenantUser.id,
        returnTo: body.returnTo,
      });
      sendJson(response, 200, { authorizationUrl: oauth.authorizationUrl });
      return;
    }

    if (action === "connection" || action === "connect-status") {
      assertMethod(request, ["GET"]);
      const settings = await getTenantAdminPaymentSettings(request, access.tenant.id);
      sendJson(response, 200, { connection: settings });
      return;
    }

    if (action === "disconnect") {
      assertMethod(request, ["POST"]);
      const connection = await disconnectTenantMercadoPagoConnection({
        tenantId: access.tenant.id,
        actorUserId: access.tenantUser.id,
      });
      sendJson(response, 200, {
        disconnected: true,
        connectionStatus: connection?.status ?? "disconnected",
      });
      return;
    }

    throw new Error("Rota Mercado Pago nao encontrada.");
  });
}
