import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireTenantAdminAccess } from "../../../src/server/admin/tenantAccess.js";
import { getTenantAdminPaymentSettings } from "../../../src/server/admin/payments.js";
import {
  addTenantPaymentNote,
  getTenantPaymentById,
  listTenantPayments,
} from "../../../src/server/mercadopago/payments.js";
import { assertMethod, readJsonBody, sendJson, withApiHandler } from "../../../src/server/http.js";
import { noteSchema } from "../../../src/server/validators.js";

function getPathSegments(request: VercelRequest) {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const segments = url.pathname.split("/").filter(Boolean);
  const idx = segments.indexOf("payments");
  return idx >= 0 ? segments.slice(idx + 1) : [];
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const access = await requireTenantAdminAccess(request);
    const segments = getPathSegments(request);

    // /api/admin/payments -> list
    if (segments.length === 0) {
      assertMethod(request, ["GET"]);
      const payments = await listTenantPayments(access.tenant.id, {
        status: undefined,
        paymentMethod: undefined,
        email: request.query.email as string | undefined,
        paymentId: request.query.paymentId as string | undefined,
        externalReference: request.query.externalReference as string | undefined,
        dateFrom: request.query.dateFrom as string | undefined,
        dateTo: request.query.dateTo as string | undefined,
      });
      return sendJson(response, 200, { payments });
    }

    // /api/admin/payments/settings
    if (segments[0] === "settings") {
      assertMethod(request, ["GET"]);
      const settings = await getTenantAdminPaymentSettings(request, access.tenant.id);
      return sendJson(response, 200, { settings });
    }

    const paymentId = segments[0];

    // /api/admin/payments/:id/note
    if (segments[1] === "note") {
      assertMethod(request, ["POST"]);
      const body = noteSchema.parse(await readJsonBody<{ note: string }>(request));
      const note = await addTenantPaymentNote({
        tenantId: access.tenant.id,
        paymentId,
        note: body.note,
        createdByUserId: access.tenantUser.id,
      });
      return sendJson(response, 201, { note });
    }

    // /api/admin/payments/:id
    assertMethod(request, ["GET"]);
    const details = await getTenantPaymentById(access.tenant.id, paymentId);
    if (!details) {
      return sendJson(response, 404, { error: "Payment not found" });
    }
    return sendJson(response, 200, details);
  });
}
