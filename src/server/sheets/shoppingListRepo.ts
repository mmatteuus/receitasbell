import { ApiError } from "../http.js";
import { SheetRecord } from "./schema.js";
import { mutateTable, readTable } from "./table.js";
import { asBoolean, nowIso, sanitizeForSpreadsheet } from "./utils.js";

export interface ShoppingListItemRecord {
  id: string;
  userId: string;
  recipeId: string | null;
  recipeTitleSnapshot: string;
  text: string;
  checked: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapShoppingListItem(row: SheetRecord<"shopping_list_items">): ShoppingListItemRecord {
  return {
    id: row.id,
    userId: row.user_id,
    recipeId: row.recipe_id || null,
    recipeTitleSnapshot: row.recipe_title_snapshot,
    text: row.text,
    checked: asBoolean(row.checked),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listShoppingListItems(userId: string) {
  const rows = await readTable("shopping_list_items");
  return rows
    .filter((row) => row.user_id === userId)
    .map(mapShoppingListItem)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export async function createShoppingListItems(
  userId: string,
  items: Array<{ recipeId?: string | null; recipeTitleSnapshot?: string; text: string; checked?: boolean }>,
) {
  const createdAt = nowIso();
  const validItems = items.map((item) => ({
    recipe_id: item.recipeId ?? "",
    recipe_title_snapshot: sanitizeForSpreadsheet(item.recipeTitleSnapshot?.trim() || ""),
    text: sanitizeForSpreadsheet(item.text.trim()),
    checked: item.checked ? "true" : "false",
  })).filter((item) => item.text);

  if (!validItems.length) {
    throw new ApiError(400, "At least one shopping list item is required");
  }

  const rows = await mutateTable("shopping_list_items", async (current) => [
    ...current,
    ...validItems.map((item) => ({
      id: crypto.randomUUID(),
      user_id: userId,
      recipe_id: item.recipe_id,
      recipe_title_snapshot: item.recipe_title_snapshot,
      text: item.text,
      checked: item.checked,
      created_at: createdAt,
      updated_at: createdAt,
    })),
  ]);

  return rows
    .filter((row) => row.user_id === userId)
    .map(mapShoppingListItem)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export async function updateShoppingListItem(
  userId: string,
  itemId: string,
  patch: Partial<{ text: string; checked: boolean }>,
) {
  const updatedAt = nowIso();
  let found = false;

  const rows = await mutateTable("shopping_list_items", async (current) =>
    current.map((row) => {
      if (row.id !== itemId || row.user_id !== userId) {
        return row;
      }

      found = true;
      return {
        ...row,
        text: patch.text ? sanitizeForSpreadsheet(patch.text.trim()) : row.text,
        checked: patch.checked === undefined ? row.checked : String(patch.checked),
        updated_at: updatedAt,
      };
    }),
  );

  if (!found) {
    throw new ApiError(404, "Shopping list item not found");
  }

  return mapShoppingListItem(rows.find((row) => row.id === itemId)!);
}

export async function deleteShoppingListItem(userId: string, itemId: string) {
  let deleted = false;
  await mutateTable("shopping_list_items", async (current) =>
    current.filter((row) => {
      if (row.id === itemId && row.user_id === userId) {
        deleted = true;
        return false;
      }
      return true;
    }),
  );

  if (!deleted) {
    throw new ApiError(404, "Shopping list item not found");
  }
}
