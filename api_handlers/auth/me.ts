import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json } from "../../src/server/shared/http.js";
import { getSession } from "../../src/server/auth/sessions.js";
import { requireTenantFromRequest } from "../../src/server/tenancy/resolver.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withApiHandler(req, res, async ({ requestId }) => {
    const s = await getSession(req);
    if (!s) {
      return json(res, 200, {
        success: true,
        data: {
          user: null,
          authenticated: false,
        },
        requestId,
      });
    }

    let tenantSlug: string | null = null;
    try {
      const { tenant } = await requireTenantFromRequest(req);
      tenantSlug = tenant.slug;
    } catch {
      tenantSlug = null;
    }

    return json(res, 200, {
      success: true,
      data: {
        user: {
          userId: s.userId,
          email: s.email,
          tenantId: s.tenantId,
          tenantSlug,
          role: s.role,
        },
      },
      requestId,
    });
  });
}
