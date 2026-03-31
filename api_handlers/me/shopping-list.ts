import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, ApiError } from '../../src/server/shared/http.js';
import { requireIdentityUser } from '../../src/server/auth/guards.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import {
  listShoppingListItems,
  createShoppingListItems,
  updateShoppingListItem,
  deleteShoppingListItem,
} from '../../src/server/identity/shoppingList.repo.js';
import {
  shoppingListCreateSchema,
  shoppingListUpdateSchema,
} from '../../src/server/shared/validators.js';
import { requireCsrf } from '../../src/server/security/csrf.js';

export default withApiHandler(
  async (request: VercelRequest, response: VercelResponse, { requestId }) => {
    const { tenant } = await requireTenantFromRequest(request);
    const identity = await requireIdentityUser(request);
    const userId = String(identity.user!.id);

    const method = (request.method || 'GET').toUpperCase();
    const url = new URL(request.url || '', 'http://localhost');
    const id = url.searchParams.get('id');

    if (method === 'GET') {
      const items = await listShoppingListItems(tenant.id, userId);
      return json(response, 200, { items, requestId });
    }

    // CSRF required for mutations
    requireCsrf(request);

    if (method === 'POST') {
      const body = shoppingListCreateSchema.parse(request.body);
      const items = await createShoppingListItems(tenant.id, userId, body.items);
      return json(response, 201, { items, requestId });
    }

    if (method === 'PATCH' || method === 'PUT') {
      if (!id) throw new ApiError(400, 'Missing item ID');
      const body = shoppingListUpdateSchema.parse(request.body);
      const item = await updateShoppingListItem(tenant.id, userId, id, body);
      return json(response, 200, { item, requestId });
    }

    if (method === 'DELETE') {
      if (!id) throw new ApiError(400, 'Missing item ID');
      await deleteShoppingListItem(tenant.id, userId, id);
      return json(response, 200, { success: true, requestId });
    }

    throw new ApiError(405, `Method ${method} not allowed`);
  }
);
