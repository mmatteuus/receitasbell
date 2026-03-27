import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json, assertMethod, readJsonBody } from "../../src/server/shared/http.js";
import { createMagicLink } from "../../src/server/auth/magicLinks.js";
import { sendMagicLinkEmail } from "../../src/server/integrations/email/client.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withApiHandler(req, res, async ({ requestId }) => {
    assertMethod(req, ["POST"]);
    const body = await readJsonBody<{ tenantId?: string | number; email?: string }>(req);
    const tenantId = body?.tenantId;
    const email = body?.email;

    const { token } = await createMagicLink({ tenantId: String(tenantId), email: String(email), purpose: "user" });

    const url = `${process.env.APP_BASE_URL}/auth/verify?token=${encodeURIComponent(token)}&tenantId=${encodeURIComponent(String(tenantId))}`;
    await sendMagicLinkEmail(String(email), url);

    return json(res, 200, { success: true, data: { ok: true }, requestId });
  });
}
