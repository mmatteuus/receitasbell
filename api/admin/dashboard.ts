import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getTenantFinancialStats } from "../../../src/server/admin/stats.js";
import { requireTenantAdminAccess } from "../../../src/server/admin/tenantAccess.js";
import { sendError, withApiHandler } from "../../../src/server/http.js";

/**
 * GET /api/admin/dashboard
 * Retorna estatísticas financeiras para o administrador logado.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withApiHandler(req, res, async () => {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const context = await requireTenantAdminAccess(req);
    const stats = await getTenantFinancialStats(context.tenant.id);
    return res.json(stats);
  });
}
