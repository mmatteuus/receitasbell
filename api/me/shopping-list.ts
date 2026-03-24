import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, requireIdentityUser, readJsonBody, ApiError } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { listShoppingListItems, createShoppingListItems, updateShoppingListItem, deleteShoppingListItem } from '../../src/server/identity/shoppingList.repo.js';
import { shoppingListCreateSchema, shoppingListUpdateSchema } from '../../src/server/shared/validators.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const { tenant } = await requireTenantFromRequest(request);
    const identity = await requireIdentityUser(request);
    const userId = String(identity.user!.id);

    const url = new URL(request.url || '', 'http://localhost');
    const id = url.searchParams.get('id');

    if (request.method === 'GET') {
      const items = await listShoppingListItems(tenant.id, userId);
      return sendJson(response, 200, { items });
    }

    if (request.method === 'POST') {
      const body = shoppingListCreateSchema.parse(await readJsonBody(request));
      const items = await createShoppingListItems(tenant.id, userId, body.items);
      return sendJson(response, 201, { items });
    }

    if (request.method === 'PATCH' || request.method === 'PUT') {
      if (!id) throw new ApiError(400, 'Missing item ID');
      const body = shoppingListUpdateSchema.parse(await readJsonBody(request));
      const item = await updateShoppingListItem(tenant.id, id, [body]);
      return sendJson(response, 200, { item });
    }

    if (request.method === 'DELETE') {
      if (!id) throw new ApiError(400, 'Missing item ID');
      await deleteShoppingListItem(tenant.id, userId, id);
      return sendJson(response, 204, {});
    }

    throw new ApiError(405, `Method ${request.method} not allowed`);
  });
}

