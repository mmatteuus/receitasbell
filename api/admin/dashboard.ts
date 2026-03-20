import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getTenantFinancialStats } from "../../src/server/admin/stats.js";
import { requireTenantAdminAccess } from "../../src/server/admin/tenantAccess.js";
import { sendError, withApiHandler } from "../../src/server/http.js";

/**
 * GET /api/admin/dashboard
 * Retorna estatísticas financeiras para o administrador logado.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withApiHandler(req, res, async () => {
    if (req.method !== "GET") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const context = await requireTenantAdminAccess(req);
    const stats = await getTenantFinancialStats(context.tenant.id);
    res.json(stats);
  });
}
