import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json, assertMethod, getAppBaseUrl, readJsonBody } from "../../src/server/shared/http.js";
import { createMagicLink } from "../../src/server/auth/magicLinks.js";
import { sendMagicLinkEmail } from "../../src/server/integrations/email/client.js";
import { requireTenantFromRequest } from "../../src/server/tenancy/resolver.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withApiHandler(req, res, async ({ requestId }) => {
    assertMethod(req, ["POST"]);
    const { tenant } = await requireTenantFromRequest(req);
    const body = await readJsonBody<{ email?: string; redirectTo?: string | null }>(req);
    const email = body?.email;

    const redirectTo = body?.redirectTo?.trim() || "/pwa/app";
    const { token } = await createMagicLink({
      tenantId: String(tenant.id),
      email: String(email),
      purpose: "user",
      redirectTo,
    });

    const url = `${getAppBaseUrl(req)}/t/${encodeURIComponent(tenant.slug)}/pwa/auth/verify?token=${encodeURIComponent(token)}`;
    await sendMagicLinkEmail(String(email), url);

    return json(res, 200, {
      success: true,
      data: {
        ok: true,
        redirectTo,
        tenantSlug: tenant.slug,
      },
      requestId,
    });
  });
}
