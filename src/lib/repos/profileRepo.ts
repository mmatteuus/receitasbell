import type { Entitlement } from "@/types/entitlement";
import { listFavorites, listShoppingList } from "@/lib/api/interactions";
import { listRecipes } from "@/lib/api/recipes";
import { clearIdentityEmail, getIdentityEmail, setIdentityEmail } from "@/lib/api/identity";
import { listByEmail } from "@/lib/repos/entitlementRepo";

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

export function get() {
  return {
    email: getIdentityEmail(),
  };
}

export function save(email: string) {
  setIdentityEmail(email.trim().toLowerCase());
}

export function clear() {
  clearIdentityEmail();
}

export async function listEntitlementsForProfile(): Promise<Entitlement[]> {
  const email = getIdentityEmail();
  if (!email) {
    return [];
  }

  return listByEmail(email);
}

export const profileRepo = {
  get,
  save,
  clear,
  getOverview: getProfileOverview,
};
