import { ApiError } from '../shared/http.js';
import { supabaseAdmin } from '../integrations/supabase/client.js';

type ShoppingListRow = {
  id: string;
  recipe_id: string | null;
  items_json: string | null;
  tenant_id: string | number;
  user_id: string | number;
};

type ShoppingItemPayload = {
  clientId?: string;
  recipeId?: string | null;
  recipeTitleSnapshot?: string;
  text?: string;
  checked?: boolean;
  updatedAt?: string;
  deletedAt?: string | null;
  lastOpId?: string | null;
};

export type ShoppingListItemRecord = {
  id: string;
  serverId: string;
  clientId: string;
  userId: string;
  recipeId: string | null;
  recipeTitleSnapshot: string;
  text: string;
  checked: boolean;
  createdAt: string;
  updatedAt: string;
};

function nowIso() {
  return new Date().toISOString();
}

function parsePayloads(row: ShoppingListRow): ShoppingItemPayload[] {
  if (!row.items_json) {
    return [];
  }

  try {
    const parsed = JSON.parse(row.items_json);
    if (Array.isArray(parsed)) {
      return parsed.map((entry) => {
        if (typeof entry === 'string') {
          return {
            text: entry,
          };
        }

        return entry as ShoppingItemPayload;
      });
    }

    if (parsed && typeof parsed === 'object') {
      return [parsed as ShoppingItemPayload];
    }
  } catch {
    return [];
  }

  return [];
}

function buildItemId(rowId: string | number, index: number, multiItem: boolean) {
  return multiItem ? `${rowId}:${index}` : String(rowId);
}

function mapRowPayloadToItem(
  row: ShoppingListRow,
  payload: ShoppingItemPayload,
  index: number,
  total: number
): ShoppingListItemRecord {
  const rowId = String(row.id ?? '');
  const clientId = payload.clientId || buildItemId(rowId, index, total > 1);
  const updatedAt = payload.updatedAt || nowIso();
  const createdAt = updatedAt;

  return {
    id: buildItemId(rowId, index, total > 1),
    serverId: rowId,
    clientId,
    userId: String(row.user_id ?? ''),
    recipeId: payload.recipeId ?? row.recipe_id ?? null,
    recipeTitleSnapshot: payload.recipeTitleSnapshot || 'Itens avulsos',
    text: payload.text || '',
    checked: Boolean(payload.checked),
    createdAt,
    updatedAt,
  };
}

export async function listShoppingListItems(
  tenantId: string | number,
  userId: string
): Promise<ShoppingListItemRecord[]> {
  const { data, error } = await supabaseAdmin
    .from('shopping_list')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId);

  if (error) throw new ApiError(500, 'Erro ao buscar lista de compras', { original: error });

  return (data || []).flatMap((row) => {
    const payloads = parsePayloads(row as unknown as ShoppingListRow);
    return payloads
      .filter((payload) => !payload.deletedAt)
      .map((payload, index) =>
        mapRowPayloadToItem(row as unknown as ShoppingListRow, payload, index, payloads.length)
      );
  });
}

async function findRowByClientId(tenantId: string | number, userId: string, clientId: string) {
  const { data } = await supabaseAdmin
    .from('shopping_list')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .ilike('items_json', `%${clientId}%`)
    .limit(1);

  return data?.[0] || null;
}

export async function createShoppingListItems(
  tenantId: string | number,
  userId: string,
  items: Array<{
    clientId?: string;
    recipeId?: string | null;
    recipeTitleSnapshot?: string;
    text: string;
    checked?: boolean;
    updatedAt?: string;
  }>
): Promise<ShoppingListItemRecord[]> {
  const created: ShoppingListItemRecord[] = [];

  for (const item of items) {
    const clientId = item.clientId || crypto.randomUUID();
    const existingRow = await findRowByClientId(tenantId, userId, clientId);
    if (existingRow) {
      const existingPayloads = parsePayloads(existingRow as unknown as ShoppingListRow);
      const existingIndex = existingPayloads.findIndex((payload) => payload.clientId === clientId);
      if (existingIndex >= 0) {
        created.push(
          mapRowPayloadToItem(
            existingRow as unknown as ShoppingListRow,
            existingPayloads[existingIndex],
            existingIndex,
            existingPayloads.length
          )
        );
        continue;
      }
    }

    const payload: ShoppingItemPayload = {
      clientId,
      recipeId: item.recipeId ?? null,
      recipeTitleSnapshot: item.recipeTitleSnapshot || 'Itens avulsos',
      text: item.text,
      checked: Boolean(item.checked),
      updatedAt: item.updatedAt || nowIso(),
      deletedAt: null,
      lastOpId: null,
    };

    const { data: row, error } = await supabaseAdmin
      .from('shopping_list')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        recipe_id: payload.recipeId || null,
        items_json: JSON.stringify(payload),
      })
      .select()
      .single();

    if (error)
      throw new ApiError(500, 'Erro ao criar item da lista de compras', { original: error });

    created.push(mapRowPayloadToItem(row as unknown as ShoppingListRow, payload, 0, 1));
  }

  return created;
}

function parseCompositeItemId(itemId: string) {
  const [rowId, index] = itemId.split(':');
  return {
    rowId,
    index: index !== undefined ? Number(index) : 0,
    composite: index !== undefined,
  };
}

async function getOwnedRow(tenantId: string | number, userId: string, rowId: string) {
  const { data, error } = await supabaseAdmin
    .from('shopping_list')
    .select('*')
    .eq('id', rowId)
    .single();

  if (error || !data) throw new ApiError(404, 'Shopping list item not found');
  if (String(data.tenant_id) !== String(tenantId) || String(data.user_id) !== String(userId)) {
    throw new ApiError(404, 'Shopping list item not found');
  }
  return data;
}

export async function updateShoppingListItem(
  tenantId: string | number,
  userId: string,
  itemId: string,
  patch: {
    clientId?: string;
    text?: string;
    checked?: boolean;
    baseVersion?: string;
    updatedAt?: string;
  }
): Promise<ShoppingListItemRecord> {
  const { rowId, index } = parseCompositeItemId(itemId);
  const row = await getOwnedRow(tenantId, userId, rowId);
  const payloads = parsePayloads(row as unknown as ShoppingListRow);
  const currentPayload = payloads[index] || payloads[0];
  if (!currentPayload) {
    throw new ApiError(404, 'Shopping list item not found');
  }

  if (
    patch.baseVersion &&
    currentPayload.updatedAt &&
    patch.baseVersion !== currentPayload.updatedAt
  ) {
    throw new ApiError(409, 'Shopping list conflict detected', {
      server: mapRowPayloadToItem(
        row as unknown as ShoppingListRow,
        currentPayload,
        index,
        payloads.length
      ),
    });
  }

  const nextPayload: ShoppingItemPayload = {
    ...currentPayload,
    clientId:
      patch.clientId || currentPayload.clientId || buildItemId(rowId, index, payloads.length > 1),
    text: patch.text !== undefined ? patch.text : currentPayload.text,
    checked: patch.checked !== undefined ? patch.checked : currentPayload.checked,
    updatedAt: patch.updatedAt || nowIso(),
  };

  const nextPayloads = [...payloads];
  nextPayloads[index] = nextPayload;

  const { data: updatedRow, error } = await supabaseAdmin
    .from('shopping_list')
    .update({
      recipe_id: nextPayload.recipeId || null,
      items_json: JSON.stringify(nextPayloads.length === 1 ? nextPayloads[0] : nextPayloads),
    })
    .eq('id', rowId)
    .select()
    .single();

  if (error)
    throw new ApiError(500, 'Erro ao atualizar item da lista de compras', { original: error });

  return mapRowPayloadToItem(
    updatedRow as unknown as ShoppingListRow,
    nextPayload,
    index,
    nextPayloads.length
  );
}

export async function deleteShoppingListItem(
  tenantId: string | number,
  userId: string,
  itemId: string
): Promise<void> {
  const { rowId, index } = parseCompositeItemId(itemId);
  const row = await getOwnedRow(tenantId, userId, rowId);
  const payloads = parsePayloads(row as unknown as ShoppingListRow);
  const currentPayload = payloads[index] || payloads[0];
  if (!currentPayload) {
    return;
  }

  if (currentPayload.deletedAt) {
    return;
  }

  const nextPayloads = [...payloads];
  nextPayloads[index] = {
    ...currentPayload,
    deletedAt: nowIso(),
    updatedAt: nowIso(),
  };

  await supabaseAdmin
    .from('shopping_list')
    .update({
      items_json: JSON.stringify(nextPayloads.length === 1 ? nextPayloads[0] : nextPayloads),
    })
    .eq('id', rowId);
}
