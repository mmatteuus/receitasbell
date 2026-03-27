import { listFavorites, listShoppingList } from "@/lib/api/interactions";
import { listRecipes } from "@/lib/api/recipes";
import { listByEmail } from "@/lib/repos/entitlementRepo";
import type { Entitlement } from "@/types/entitlement";

export async function getProfileOverview() {
  const [favoriteRecords, shoppingItems, recipes] = await Promise.all([
    listFavorites().catch(() => []),
    listShoppingList().catch(() => []),
    listRecipes().catch(() => []),
  ]);

  const unlockedRecipes = recipes.filter((recipe) => recipe.accessTier === "paid" && recipe.hasAccess);
  return {
    favoriteRecords,
    shoppingItems,
    unlockedRecipes,
    purchasedRecipes: unlockedRecipes,
  };
}

export async function listEntitlementsForProfile(): Promise<Entitlement[]> {
  // Now entitlements are resolved server-side; 
  // this client function is mostly legacy or can be refactored to check /api/auth/me
  return [];
}

export const profileRepo = {
  get,
  save,
  clear,
  getOverview: getProfileOverview,
};
