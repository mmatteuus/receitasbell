import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json } from '../../src/server/shared/http.js';
import { requireIdentityUser } from '../../src/server/auth/guards.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { baserowFetch } from '../../src/server/integrations/baserow/client.js';
import { baserowTables } from '../../src/server/integrations/baserow/tables.js';

type PaymentOrderRow = {
  id?: string | number;
  amount?: string | number;
  status?: string;
  created_at?: string;
  recipe_ids_json?: string | null;
  items_json?: string | null;
};

export default withApiHandler(
  async (request: VercelRequest, response: VercelResponse, { requestId }) => {
    const { tenant } = await requireTenantFromRequest(request);
    const user = await requireIdentityUser(request);

    // Filter by tenant and the authenticated user's ID
    const data = await baserowFetch<{ results: PaymentOrderRow[] }>(
      `/api/database/rows/table/${baserowTables.paymentOrders}/?user_field_names=true&filter__tenantId__equal=${tenant.id}&filter__userId__equal=${user.user?.id}`
    );

    return json(response, 200, {
      items: data.results.map((row) => ({
        id: String(row.id ?? ''),
        amount: Number(row.amount ?? 0),
        status: row.status ?? '',
        createdAt: row.created_at ?? '',
        recipeIds: JSON.parse(row.recipe_ids_json || '[]'),
        items: JSON.parse(row.items_json || '[]'),
      })),
      meta: {
        total: data.results.length,
      },
      requestId,
    });
  }
);
