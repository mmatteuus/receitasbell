import type { VercelRequest, VercelResponse } from "@vercel/node";
import { addTenantPaymentNote } from "../../../../src/server/mercadopago/payments.js";
import { requireTenantAdminAccess } from "../../../../src/server/admin/tenantAccess.js";
import { assertMethod, readJsonBody, sendJson, withApiHandler } from "../../../../src/server/http.js";
import { noteSchema } from "../../../../src/server/validators.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["POST"]);
    const access = await requireTenantAdminAccess(request);
    const paymentId = String(request.query.id || "");
    const body = noteSchema.parse(await readJsonBody<{ note: string }>(request));
    const note = await addTenantPaymentNote({
      tenantId: access.tenant.id,
      paymentId,
      note: body.note,
      createdByUserId: access.tenantUser.id,
    });

    return sendJson(response, 201, { note });
  });
}
