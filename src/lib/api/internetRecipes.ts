import type { RecipeRecord } from "@/lib/recipes/types";
import { generateSlug } from "@/lib/helpers";

type MealDbMeal = {
  idMeal: string;
  strMeal: string;
  strCategory: string | null;
  strInstructions: string | null;
  strMealThumb: string | null;
  [key: string]: string | null;
};

const MEALDB_SEARCH_URL = "https://www.themealdb.com/api/json/v1/1/search.php?s=";
const CACHE_TTL_MS = 10 * 60 * 1000;

let cachedRecipes: RecipeRecord[] | null = null;
let cachedAt = 0;

function parseBoolean(value: string | undefined) {
  if (!value) return undefined;
  if (value === "1" || value.toLowerCase() === "true") return true;
  if (value === "0" || value.toLowerCase() === "false") return false;
  return undefined;
}

export function isInternetFallbackEnabled() {
  const envValue = parseBoolean(import.meta.env.VITE_ENABLE_INTERNET_FALLBACK);
  if (envValue !== undefined) return envValue;
  return Boolean(import.meta.env.DEV);
}

function toInstructionSteps(instructions: string | null): string[] {
  if (!instructions) {
    return ["Modo de preparo indisponivel."];
  }

  const normalized = instructions
    .replace(/\r\n/g, "\n")
    .replace(/\.\s+/g, ".\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return normalized.length > 0 ? normalized : [instructions];
}

function toIngredients(meal: MealDbMeal): string[] {
  const ingredients: string[] = [];

  for (let index = 1; index <= 20; index += 1) {
    const ingredient = meal[`strIngredient${index}`]?.trim();
    const measure = meal[`strMeasure${index}`]?.trim();
    if (!ingredient) continue;
    ingredients.push(measure ? `${measure} ${ingredient}`.trim() : ingredient);
  }

  return ingredients.length > 0 ? ingredients : ["Ingredientes indisponiveis."];
}

function mapMealToRecipe(meal: MealDbMeal, index: number): RecipeRecord {
  const createdAt = new Date().toISOString();
  const prepTime = 20 + (index % 3) * 10;
  const cookTime = 25 + (index % 4) * 10;
  const title = meal.strMeal?.trim() || `Receita ${index + 1}`;
  const slugBase = generateSlug(title) || `receita-${index + 1}`;
  const categorySlug = generateSlug(meal.strCategory || "geral") || "geral";
  const instructions = toInstructionSteps(meal.strInstructions);
  const ingredients = toIngredients(meal);
  const isPaid = index % 5 === 0;
  const priceBRL = isPaid ? 19.9 + (index % 3) * 5 : null;

  return {
    id: `internet-${meal.idMeal}`,
    slug: `internet-${slugBase}-${meal.idMeal}`,
    title,
    description: meal.strInstructions?.slice(0, 140) || "Receita importada automaticamente.",
    imageUrl: meal.strMealThumb || "/placeholder.svg",
    categorySlug,
    tags: [categorySlug, "internet", "fallback", ...(isPaid ? ["premium"] : [])],
    status: "published",
    prepTime,
    cookTime,
    totalTime: prepTime + cookTime,
    servings: 4,
    accessTier: isPaid ? "paid" : "free",
    priceBRL,
    fullIngredients: ingredients,
    fullInstructions: instructions,
    excerpt: meal.strInstructions?.slice(0, 180) || undefined,
    createdByUserId: null,
    createdAt,
    updatedAt: createdAt,
    publishedAt: createdAt,
    isFeatured: index < 8,
    ratingAvg: 0,
    ratingCount: 0,
    hasAccess: !isPaid,
  };
}

export async function getInternetRecipes(): Promise<RecipeRecord[]> {
  if (cachedRecipes && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedRecipes;
  }

  const response = await fetch(MEALDB_SEARCH_URL);
  if (!response.ok) {
    throw new Error(`Fallback API failed with ${response.status}`);
  }

  const data = (await response.json()) as { meals?: MealDbMeal[] | null };
  const recipes = (data.meals || []).slice(0, 24).map(mapMealToRecipe);

  cachedRecipes = recipes;
  cachedAt = Date.now();
  return recipes;
}

export function filterInternetRecipes(
  recipes: RecipeRecord[],
  params: {
    categorySlug?: string;
    q?: string;
    ids?: string[];
    tier?: "all" | "free" | "paid";
    tempo?: "all" | "quick" | "medium" | "long";
    ordem?: "latest" | "timeAsc" | "timeDesc";
  } = {},
): RecipeRecord[] {
  const ids = params.ids && params.ids.length > 0 ? new Set(params.ids) : null;
  const q = params.q?.trim().toLowerCase();

  const filtered = recipes.filter((recipe) => {
    if (params.categorySlug && recipe.categorySlug !== params.categorySlug) return false;
    if (ids && !ids.has(recipe.id)) return false;
    if (params.tier && params.tier !== "all" && recipe.accessTier !== params.tier) return false;

    if (params.tempo === "quick" && recipe.totalTime > 30) return false;
    if (params.tempo === "medium" && (recipe.totalTime <= 30 || recipe.totalTime > 60)) return false;
    if (params.tempo === "long" && recipe.totalTime <= 60) return false;

    if (!q) return true;

    const searchable = `${recipe.title} ${recipe.description} ${recipe.tags.join(" ")}`.toLowerCase();
    return searchable.includes(q);
  });

  if (params.ordem === "timeAsc") {
    return filtered.sort((a, b) => a.totalTime - b.totalTime);
  }

  if (params.ordem === "timeDesc") {
    return filtered.sort((a, b) => b.totalTime - a.totalTime);
  }

  return filtered.sort((a, b) => (b.publishedAt || b.updatedAt || "").localeCompare(a.publishedAt || a.updatedAt || ""));
}
