import type { ImageFileMeta } from "../../types/recipe.js";
import type { RecipeRecord } from "../../lib/recipes/types.js";
import { ApiError } from "../http.js";
import { SheetRecord } from "./schema.js";
import { mutateTable, readTable } from "./table.js";
import { getCategoryBySlug } from "./categoriesRepo.js";
import { listEntitlementsByEmail } from "./entitlementsRepo.js";
import { getRatingsSummaryByRecipeIds } from "./ratingsRepo.js";
import { asBoolean, asJson, asNullableString, asNumber, createUniqueSlug, nowIso, toJsonString } from "./utils.js";

export interface ListRecipesOptions {
  categorySlug?: string;
  q?: string;
  ids?: string[];
  includeDrafts?: boolean;
  identity?: {
    userId?: string | null;
    email?: string | null;
  };
}

export interface RecipeMutationInput {
  id?: string;
  slug?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  imageFileMeta?: ImageFileMeta | null;
  categorySlug: string;
  tags?: string[];
  status?: "draft" | "published";
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  accessTier?: "free" | "paid";
  priceBRL?: number | null;
  fullIngredients?: string[];
  fullInstructions?: string[];
  publishedAt?: string | null;
  createdAt?: string;
  createdByUserId?: string | null;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  isFeatured?: boolean;
}

type RecipeTables = {
  recipeRows: SheetRecord<"recipes">[];
  ingredientRows: SheetRecord<"recipe_ingredients">[];
  instructionRows: SheetRecord<"recipe_instructions">[];
  tagRows: SheetRecord<"recipe_tags">[];
};

async function loadRecipeTables(): Promise<RecipeTables> {
  const [recipeRows, ingredientRows, instructionRows, tagRows] = await Promise.all([
    readTable("recipes"),
    readTable("recipe_ingredients"),
    readTable("recipe_instructions"),
    readTable("recipe_tags"),
  ]);

  return {
    recipeRows,
    ingredientRows,
    instructionRows,
    tagRows,
  };
}

function buildRecipeFromRow(
  row: SheetRecord<"recipes">,
  tables: RecipeTables,
  ratingsSummary: Record<string, { avg: number; count: number }>,
  entitledRecipeSlugs: Set<string>,
): RecipeRecord {
  const tags = tables.tagRows
    .filter((tagRow) => tagRow.recipe_id === row.id)
    .map((tagRow) => tagRow.tag)
    .filter(Boolean);

  const fallbackTags = asJson<string[]>(row.tags_json, []);
  const ingredientsFromChildRows = tables.ingredientRows
    .filter((ingredientRow) => ingredientRow.recipe_id === row.id)
    .sort((left, right) => asNumber(left.position) - asNumber(right.position))
    .map((ingredientRow) => ingredientRow.text)
    .filter(Boolean);
  const instructionsFromChildRows = tables.instructionRows
    .filter((instructionRow) => instructionRow.recipe_id === row.id)
    .sort((left, right) => asNumber(left.position) - asNumber(right.position))
    .map((instructionRow) => instructionRow.text)
    .filter(Boolean);
  const summary = ratingsSummary[row.id] ?? { avg: 0, count: 0 };
  const imageUrl = row.image_url?.trim() || null;
  const imageFileMeta = asJson<ImageFileMeta | null>(row.image_file_meta_json, null);
  const accessTier = row.access_tier === "paid" ? "paid" : "free";
  const fullIngredients = asJson<string[]>(row.full_ingredients_json, ingredientsFromChildRows);
  const fullInstructions = asJson<string[]>(
    row.full_instructions_json,
    instructionsFromChildRows,
  );
  const hasAccess = accessTier === "free" || entitledRecipeSlugs.has(row.slug);
  const teaserIngredients = fullIngredients.slice(0, 2);
  const teaserInstructions = fullInstructions.slice(0, 2);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    imageUrl,
    imageFileMeta,
    categorySlug: row.category_slug,
    tags: tags.length ? tags : fallbackTags,
    status: row.status === "published" ? "published" : "draft",
    prepTime: asNumber(row.prep_time),
    cookTime: asNumber(row.cook_time),
    totalTime: asNumber(row.total_time),
    servings: asNumber(row.servings, 1),
    accessTier,
    priceBRL: accessTier === "paid" ? asNumber(row.price_brl) : null,
    fullIngredients: hasAccess ? fullIngredients : teaserIngredients,
    fullInstructions: hasAccess ? fullInstructions : teaserInstructions,
    excerpt: row.excerpt || undefined,
    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,
    isFeatured: asBoolean(row.is_featured),
    createdByUserId: asNullableString(row.created_by_user_id),
    ratingAvg: summary.avg,
    ratingCount: summary.count,
    hasAccess,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: asNullableString(row.published_at),
  };
}

function normalizeRecipeInput(
  input: RecipeMutationInput,
  existingRows: SheetRecord<"recipes">[],
  existingRow?: SheetRecord<"recipes">,
) {
  const title = input.title.trim();
  if (!title) {
    throw new ApiError(400, "Recipe title is required");
  }

  const accessTier = input.accessTier === "paid" ? "paid" : "free";
  const priceBRL = accessTier === "paid" ? Number(input.priceBRL ?? 0) : 0;
  if (accessTier === "paid" && (!Number.isFinite(priceBRL) || priceBRL <= 0)) {
    throw new ApiError(400, "Paid recipes require a price greater than zero");
  }

  const imageUrl = input.imageUrl?.trim() || input.imageFileMeta?.publicUrl || "";
  if (imageUrl.startsWith("data:")) {
    throw new ApiError(400, "Image data URLs are not allowed. Use a remote image URL.");
  }

  const slug =
    existingRow?.published_at?.trim()
      ? existingRow.slug
      : createUniqueSlug(
          title,
          existingRows.filter((row) => row.id !== existingRow?.id).map((row) => row.slug),
          existingRow?.slug,
        );
  const prepTime = Math.max(0, Math.round(Number(input.prepTime ?? 0)));
  const cookTime = Math.max(0, Math.round(Number(input.cookTime ?? 0)));
  const servings = Math.max(1, Math.round(Number(input.servings ?? 1)));
  const categorySlug = input.categorySlug.trim();
  const tags = (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean);
  const ingredients = (input.fullIngredients ?? []).map((value) => value.trim()).filter(Boolean);
  const instructions = (input.fullInstructions ?? []).map((value) => value.trim()).filter(Boolean);

  if (!categorySlug) {
    throw new ApiError(400, "Category is required");
  }

  if (!ingredients.length) {
    throw new ApiError(400, "At least one ingredient is required");
  }

  if (!instructions.length) {
    throw new ApiError(400, "At least one instruction is required");
  }

  return {
    slug,
    title,
    description: input.description?.trim() || "",
    imageUrl,
    imageFileMeta: input.imageFileMeta ?? null,
    categorySlug,
    tags,
    status: input.status === "published" ? "published" : "draft",
    prepTime,
    cookTime,
    totalTime: prepTime + cookTime,
    servings,
    accessTier,
    priceBRL: accessTier === "paid" ? Number(priceBRL.toFixed(2)) : null,
    ingredients,
    instructions,
    excerpt: input.excerpt?.trim() || "",
    seoTitle: input.seoTitle?.trim() || "",
    seoDescription: input.seoDescription?.trim() || "",
    isFeatured: Boolean(input.isFeatured),
    publishedAt:
      input.status === "published"
        ? input.publishedAt ?? existingRow?.published_at ?? nowIso()
        : existingRow?.published_at || null,
    createdAt: input.createdAt,
    createdByUserId: input.createdByUserId ?? null,
  };
}

async function assertCategoryExists(categorySlug: string) {
  const category = await getCategoryBySlug(categorySlug);
  if (!category) {
    throw new ApiError(400, "Recipe category is invalid");
  }
}

async function replaceChildRows(recipeId: string, normalized: ReturnType<typeof normalizeRecipeInput>) {
  await mutateTable("recipe_ingredients", async (current) => [
    ...current.filter((row) => row.recipe_id !== recipeId),
    ...normalized.ingredients.map((text, index) => ({
      id: crypto.randomUUID(),
      recipe_id: recipeId,
      position: String(index + 1),
      text,
    })),
  ]);

  await mutateTable("recipe_instructions", async (current) => [
    ...current.filter((row) => row.recipe_id !== recipeId),
    ...normalized.instructions.map((text, index) => ({
      id: crypto.randomUUID(),
      recipe_id: recipeId,
      position: String(index + 1),
      text,
    })),
  ]);

  await mutateTable("recipe_tags", async (current) => [
    ...current.filter((row) => row.recipe_id !== recipeId),
    ...normalized.tags.map((tag) => ({
      id: crypto.randomUUID(),
      recipe_id: recipeId,
      tag,
    })),
  ]);
}

function sortRecipes(recipes: RecipeRecord[]) {
  return [...recipes].sort((left, right) => {
    if (Boolean(left.isFeatured) !== Boolean(right.isFeatured)) {
      return left.isFeatured ? -1 : 1;
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

export async function listRecipes(options: ListRecipesOptions = {}) {
  const tables = await loadRecipeTables();
  const recipeIds = tables.recipeRows.map((row) => row.id);
  const [ratingsSummary, entitlements] = await Promise.all([
    getRatingsSummaryByRecipeIds(recipeIds, options.identity),
    options.identity?.email ? listEntitlementsByEmail(options.identity.email) : Promise.resolve([]),
  ]);
  const entitledRecipeSlugs = new Set(
    entitlements
      .filter((entitlement) => entitlement.accessStatus === "active")
      .map((entitlement) => entitlement.recipeSlug),
  );

  const recipes = tables.recipeRows.map((row) =>
    buildRecipeFromRow(row, tables, ratingsSummary, entitledRecipeSlugs),
  );
  const q = options.q?.trim().toLowerCase();
  const ids = new Set<string>(options.ids ?? []);

  return sortRecipes(
    recipes.filter((recipe) => {
      if (!options.includeDrafts && recipe.status !== "published") {
        return false;
      }

      if (options.categorySlug && recipe.categorySlug !== options.categorySlug) {
        return false;
      }

      if (ids.size > 0 && !ids.has(recipe.id)) {
        return false;
      }

      if (!q) return true;

      return (
        recipe.title.toLowerCase().includes(q) ||
        recipe.description.toLowerCase().includes(q) ||
        recipe.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }),
  );
}

export async function getRecipeBySlug(
  slug: string,
  options: Pick<ListRecipesOptions, "includeDrafts" | "identity"> = {},
) {
  const recipes = await listRecipes({
    includeDrafts: true,
    identity: options.identity,
  });
  const recipe = recipes.find((item) => item.slug === slug) ?? null;

  if (!recipe) return null;
  if (!options.includeDrafts && recipe.status !== "published") return null;

  return recipe;
}

export async function getRecipeById(
  id: string,
  options: Pick<ListRecipesOptions, "includeDrafts" | "identity"> = {},
) {
  const recipes = await listRecipes({
    includeDrafts: options.includeDrafts ?? true,
    ids: [id],
    identity: options.identity,
  });

  return recipes.find((recipe) => recipe.id === id) ?? null;
}

export async function createRecipe(input: RecipeMutationInput) {
  const { recipeRows } = await loadRecipeTables();
  const normalized = normalizeRecipeInput(input, recipeRows);
  await assertCategoryExists(normalized.categorySlug);
  const id = crypto.randomUUID();
  const now = nowIso();

  await mutateTable("recipes", async (current) => [
    ...current,
    {
      id,
      slug: normalized.slug,
      title: normalized.title,
      description: normalized.description,
      image_url: normalized.imageUrl,
      image_file_meta_json: toJsonString(normalized.imageFileMeta),
      category_slug: normalized.categorySlug,
      tags_json: toJsonString(normalized.tags),
      status: normalized.status,
      prep_time: String(normalized.prepTime),
      cook_time: String(normalized.cookTime),
      total_time: String(normalized.totalTime),
      servings: String(normalized.servings),
      access_tier: normalized.accessTier,
      price_brl: normalized.priceBRL === null ? "" : String(normalized.priceBRL),
      full_ingredients_json: toJsonString(normalized.ingredients),
      full_instructions_json: toJsonString(normalized.instructions),
      created_at: input.createdAt || now,
      updated_at: now,
      published_at: normalized.publishedAt ?? "",
      created_by_user_id: normalized.createdByUserId ?? "",
      excerpt: normalized.excerpt,
      seo_title: normalized.seoTitle,
      seo_description: normalized.seoDescription,
      is_featured: String(normalized.isFeatured),
    },
  ]);

  await replaceChildRows(id, normalized);

  return getRecipeById(id, { includeDrafts: true });
}

export async function updateRecipe(id: string, input: RecipeMutationInput) {
  const { recipeRows } = await loadRecipeTables();
  const existing = recipeRows.find((row) => row.id === id);
  if (!existing) {
    throw new ApiError(404, "Recipe not found");
  }

  const normalized = normalizeRecipeInput(input, recipeRows, existing);
  await assertCategoryExists(normalized.categorySlug);
  const now = nowIso();

  await mutateTable("recipes", async (current) =>
    current.map((row) => {
      if (row.id !== id) return row;
      return {
        ...row,
        slug: normalized.slug,
        title: normalized.title,
        description: normalized.description,
        image_url: normalized.imageUrl,
        image_file_meta_json: toJsonString(normalized.imageFileMeta),
        category_slug: normalized.categorySlug,
        tags_json: toJsonString(normalized.tags),
        status: normalized.status,
        prep_time: String(normalized.prepTime),
        cook_time: String(normalized.cookTime),
        total_time: String(normalized.totalTime),
        servings: String(normalized.servings),
        access_tier: normalized.accessTier,
        price_brl: normalized.priceBRL === null ? "" : String(normalized.priceBRL),
        full_ingredients_json: toJsonString(normalized.ingredients),
        full_instructions_json: toJsonString(normalized.instructions),
        updated_at: now,
        published_at: normalized.publishedAt ?? "",
        created_by_user_id: normalized.createdByUserId ?? row.created_by_user_id,
        excerpt: normalized.excerpt,
        seo_title: normalized.seoTitle,
        seo_description: normalized.seoDescription,
        is_featured: String(normalized.isFeatured),
      };
    }),
  );

  await replaceChildRows(id, normalized);

  return getRecipeById(id, { includeDrafts: true });
}

export async function deleteRecipe(id: string) {
  let deleted = false;

  await mutateTable("recipes", async (current) =>
    current.filter((row) => {
      if (row.id === id) {
        deleted = true;
        return false;
      }
      return true;
    }),
  );

  if (!deleted) {
    throw new ApiError(404, "Recipe not found");
  }

  await mutateTable("recipe_ingredients", async (current) => current.filter((row) => row.recipe_id !== id));
  await mutateTable("recipe_instructions", async (current) => current.filter((row) => row.recipe_id !== id));
  await mutateTable("recipe_tags", async (current) => current.filter((row) => row.recipe_id !== id));
}
