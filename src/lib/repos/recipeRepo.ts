import { Recipe } from "@/types/recipe";
import { seedRecipes } from "@/lib/seed-data";
import { generateSlug } from "@/lib/helpers";

const KEY = "rdb_recipes_v2";
type RawRecipe = Partial<Recipe> & {
  ingredients?: string[];
  instructions?: string[];
  priceCents?: number;
};

function ensureSeeded() {
  if (!localStorage.getItem(KEY)) {
    localStorage.setItem(KEY, JSON.stringify(seedRecipes));
  }
}

function readRawStorage(): RawRecipe[] {
  ensureSeeded();
  const data = localStorage.getItem(KEY);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed as RawRecipe[] : [];
  } catch {
    return [];
  }
}

function normalizeRecipe(raw: RawRecipe): Recipe {
  const title = raw.title || "Receita";
  const slug = raw.slug || generateSlug(title) || "receita";
  const ingredients = Array.isArray(raw.fullIngredients)
    ? raw.fullIngredients
    : Array.isArray(raw.ingredients)
      ? raw.ingredients
      : [];
  const instructions = Array.isArray(raw.fullInstructions)
    ? raw.fullInstructions
    : Array.isArray(raw.instructions)
      ? raw.instructions
      : [];
  const priceRaw = raw.priceBRL ?? (typeof raw.priceCents === "number" && raw.priceCents > 0 ? raw.priceCents / 100 : undefined);
  const priceValue = typeof priceRaw === "number" ? Math.round(priceRaw * 100) / 100 : undefined;

  const imageDataUrl = raw.imageDataUrl || (raw.image && raw.image.startsWith("data:") ? raw.image : undefined);
  const imageUrl = raw.imageUrl || (raw.image && !raw.image.startsWith("data:") ? raw.image : undefined);
  const image = imageDataUrl || imageUrl || raw.image || "";

  const prepTime = Number(raw.prepTime) || 0;
  const cookTime = Number(raw.cookTime) || 0;
  const totalTime = Number(raw.totalTime) || prepTime + cookTime;
  const servings = Number(raw.servings) || 1;

  return {
    id: raw.id || crypto.randomUUID(),
    slug,
    title,
    description: raw.description || "",
    image,
    imageUrl,
    imageDataUrl,
    categorySlug: raw.categorySlug || "salgadas",
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    status: raw.status === "published" ? "published" : "draft",
    prepTime,
    cookTime,
    totalTime,
    servings,
    accessTier: raw.accessTier === "paid" ? "paid" : "free",
    priceBRL: raw.accessTier === "paid" ? priceValue : undefined,
    fullIngredients: ingredients,
    fullInstructions: instructions,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    publishedAt: raw.publishedAt ?? null,
  };
}

function writeStorage(recipes: Recipe[]) {
  localStorage.setItem(KEY, JSON.stringify(recipes));
}

function snapshot(recipe: Recipe): Recipe {
  return {
    ...recipe,
    fullIngredients: [...recipe.fullIngredients],
    fullInstructions: [...recipe.fullInstructions],
  };
}

export function getRecipes(): Recipe[] {
  return readRawStorage().map(normalizeRecipe).map(snapshot);
}

export function getPublishedRecipes(): Recipe[] {
  return getRecipes().filter((r) => r.status === "published");
}

export function getRecipeBySlug(slug: string): Recipe | undefined {
  return getRecipes().find((r) => r.slug === slug);
}

export function getRecipeById(id: string): Recipe | undefined {
  return getRecipes().find((r) => r.id === id);
}

export function saveRecipe(recipe: Recipe) {
  const recipes = getRecipes();
  const idx = recipes.findIndex((r) => r.id === recipe.id);
  const normalized = snapshot(recipe);
  if (idx >= 0) {
    recipes[idx] = normalized;
  } else {
    recipes.push(normalized);
  }
  writeStorage(recipes);
}

export function deleteRecipe(id: string) {
  const recipes = getRecipes().filter((r) => r.id !== id);
  writeStorage(recipes);
}

export function isSlugTaken(slug: string, excludeId?: string) {
  return getRecipes().some((r) => r.slug === slug && r.id !== excludeId);
}

export function uniqueSlug(title: string, excludeId?: string) {
  const base = generateSlug(title) || "receita";
  let slug = base;
  let suffix = 2;
  while (isSlugTaken(slug, excludeId)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}
