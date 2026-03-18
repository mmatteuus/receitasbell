import { listFavorites, listShoppingList } from "@/lib/api/interactions";
import { listRecipes } from "@/lib/api/recipes";

export async function getProfileOverview() {
  const [favoriteRecords, shoppingItems, recipes] = await Promise.all([
    listFavorites().catch(() => []),
    listShoppingList().catch(() => []),
    listRecipes().catch(() => []),
  ]);

  const unlockedRecipes = recipes.filter((recipe) => recipe.accessTier === "paid" && recipe.isUnlocked);
  return {
    favoriteRecords,
    shoppingItems,
    unlockedRecipes,
    purchasedRecipes: unlockedRecipes,
  };
}
