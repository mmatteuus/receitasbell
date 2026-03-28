import { listRecipes } from "@/lib/api/recipes";
import { fetchMe } from "@/lib/api/identity";
import { listByEmail } from "@/lib/repos/entitlementRepo";
import { getCurrentTenantSlug } from "@/lib/tenant";
import { getProfileSnapshot, saveProfileSnapshot } from "../cache/profile-snapshot";
import { upsertRecipeSnapshots } from "../cache/recipe-snapshot";

async function loadFavoritesRepo() {
  return import("./favorites-offline-repo");
}

async function loadShoppingRepo() {
  return import("./shopping-offline-repo");
}

export async function getProfileOverviewOfflineAware() {
  const session = await fetchMe();
  const scopeKey = `${getCurrentTenantSlug() || "default"}:${session?.email || "anonymous"}`;

  if (!session?.email) {
    const cached = await getProfileSnapshot(scopeKey);
    if (cached) {
      return cached;
    }

    return {
      favoriteRecords: [],
      shoppingItems: [],
      unlockedRecipes: [],
      purchasedRecipes: [],
      lastSyncedAt: null,
    };
  }

  try {
    const [{ listFavoritesOfflineAware }, { listShoppingItemsOfflineAware }] = await Promise.all([
      loadFavoritesRepo(),
      loadShoppingRepo(),
    ]);
    const [favoriteRecords, shoppingItems, entitlements, recipes] = await Promise.all([
      listFavoritesOfflineAware(),
      listShoppingItemsOfflineAware(),
      listByEmail(session.email).catch(() => []),
      listRecipes().catch(() => []),
    ]);

    const unlockedRecipeSlugs = new Set(
      entitlements
        .filter((entitlement) => entitlement.accessStatus === "active")
        .map((entitlement) => entitlement.recipeSlug),
    );

    const unlockedRecipes = recipes.filter(
      (recipe) => recipe.accessTier === "paid" && unlockedRecipeSlugs.has(recipe.slug),
    );

    await upsertRecipeSnapshots(unlockedRecipes);

    const snapshot = {
      scopeKey,
      identity: {
        email: session.email,
        tenantSlug: session.tenantSlug,
      },
      favoriteRecords: favoriteRecords.map((item) => ({
        ...item,
        state: "active" as const,
        updatedAt: item.updatedAt,
        syncedAt: new Date().toISOString(),
        lastOpId: null,
      })),
      shoppingItems: shoppingItems.map((item) => ({
        ...item,
        localId: item.id,
        clientId: item.clientId || item.id,
        serverId: item.id,
        deleted: false,
        syncedAt: new Date().toISOString(),
        lastOpId: null,
        requiresReview: false,
      })),
      unlockedRecipes,
      purchasedRecipes: unlockedRecipes,
      lastSyncedAt: new Date().toISOString(),
    };

    await saveProfileSnapshot(snapshot);

    return {
      favoriteRecords,
      shoppingItems,
      unlockedRecipes,
      purchasedRecipes: unlockedRecipes,
      lastSyncedAt: snapshot.lastSyncedAt,
    };
  } catch {
    const cached = await getProfileSnapshot(scopeKey);
    if (cached) {
      return {
        favoriteRecords: cached.favoriteRecords,
        shoppingItems: cached.shoppingItems,
        unlockedRecipes: cached.unlockedRecipes,
        purchasedRecipes: cached.purchasedRecipes,
        lastSyncedAt: cached.lastSyncedAt,
      };
    }

    return {
      favoriteRecords: [],
      shoppingItems: [],
      unlockedRecipes: [],
      purchasedRecipes: [],
      lastSyncedAt: null,
    };
  }
}
