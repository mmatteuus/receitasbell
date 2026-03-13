import { SheetRecord } from "./schema.js";
import { mutateTable, readTable } from "./table.js";
import { nowIso } from "./utils.js";

export interface RecipeUnlockRecord {
  id: string;
  recipeId: string;
  userId: string | null;
  paymentId: string;
  unlockedAt: string;
  buyerEmail: string;
}

function mapUnlock(row: SheetRecord<"recipe_unlocks">): RecipeUnlockRecord {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    userId: row.user_id || null,
    paymentId: row.payment_id,
    unlockedAt: row.unlocked_at,
    buyerEmail: row.buyer_email,
  };
}

export async function listRecipeUnlocksForIdentity(identity: { userId?: string | null; email?: string | null }) {
  const rows = await readTable("recipe_unlocks");
  return rows
    .filter((row) => {
      if (identity.userId && row.user_id === identity.userId) return true;
      if (identity.email && row.buyer_email.trim().toLowerCase() === identity.email.trim().toLowerCase()) return true;
      return false;
    })
    .map(mapUnlock);
}

export async function ensureRecipeUnlock(input: {
  recipeId: string;
  paymentId: string;
  userId?: string | null;
  buyerEmail?: string | null;
}) {
  const email = input.buyerEmail?.trim().toLowerCase() || "";
  const existing = await listRecipeUnlocksForIdentity({
    userId: input.userId,
    email: email || null,
  });
  const found = existing.find((unlock) => unlock.recipeId === input.recipeId);
  if (found) return found;

  const id = crypto.randomUUID();
  const unlockedAt = nowIso();
  const rows = await mutateTable("recipe_unlocks", async (current) => [
    ...current,
    {
      id,
      recipe_id: input.recipeId,
      user_id: input.userId ?? "",
      payment_id: input.paymentId,
      unlocked_at: unlockedAt,
      buyer_email: email,
    },
  ]);

  return mapUnlock(rows.find((row) => row.id === id)!);
}
