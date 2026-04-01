import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json } from '../../src/server/shared/http.js';
import { requireIdentityUser } from '../../src/server/auth/guards.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { listPayments } from '../../src/server/payments/repo.js';

export default withApiHandler(
  async (request: VercelRequest, response: VercelResponse, { requestId }) => {
    const { tenant } = await requireTenantFromRequest(request);
    const user = await requireIdentityUser(request);

    const payments = await listPayments(tenant.id, {
      email: user.user?.email || undefined,
    });

    return json(response, 200, {
      items: payments.map((payment) => ({
        id: String(payment.id),
        amount: payment.totalBRL,
        status: payment.status,
        createdAt: payment.createdAt,
        recipeIds: payment.recipeIds,
        items: payment.items || [],
      })),
      meta: {
        total: payments.length,
      },
      requestId,
    });
  }
);
