import { Recipe, Comment } from "@/types/recipe";

const KEYS = {
  recipes: "rdb_recipes_v2",
  favorites: "rdb_favs_v1",
  comments: "rdb_comments_v1",
  ratings: "rdb_ratings_v1",
};

export function getRecipes(): Recipe[] {
  const data = localStorage.getItem(KEYS.recipes);
  if (!data) return [];

  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to parse recipes from localStorage", e);
    return [];
  }
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
  if (idx >= 0) recipes[idx] = recipe;
  else recipes.push(recipe);
  localStorage.setItem(KEYS.recipes, JSON.stringify(recipes));
}

export function deleteRecipe(id: string) {
  const recipes = getRecipes().filter((r) => r.id !== id);
  localStorage.setItem(KEYS.recipes, JSON.stringify(recipes));
}

export function isSlugTaken(slug: string, excludeId?: string): boolean {
  return getRecipes().some((r) => r.slug === slug && r.id !== excludeId);
}

// Favorites
export function getFavorites(): string[] {
  const data = localStorage.getItem(KEYS.favorites);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error(`Failed to parse ${KEYS.favorites} from localStorage`, e);
    return [];
  }
}

export function toggleFavorite(recipeId: string): string[] {
  const favs = getFavorites();
  const idx = favs.indexOf(recipeId);
  if (idx >= 0) favs.splice(idx, 1);
  else favs.push(recipeId);
  localStorage.setItem(KEYS.favorites, JSON.stringify(favs));
  return [...favs];
}

export function isFavorite(recipeId: string): boolean {
  return getFavorites().includes(recipeId);
}

// Ratings
export function getRatings(recipeId: string): number[] {
  const data = localStorage.getItem(KEYS.ratings);
  if (data) {
    try {
      const all = JSON.parse(data);
      if (typeof all === 'object' && all !== null) {
        return all[recipeId] || [];
      }
    } catch (e) { /* ignore */ }
  }
  return [];
}

export function addRating(recipeId: string, value: number) {
  const data = localStorage.getItem(KEYS.ratings);
  let all: Record<string, number[]> = {};
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (typeof parsed === 'object' && parsed !== null) {
        all = parsed;
      }
    } catch (e) { /* ignore */ }
  }
  
  if (!all[recipeId]) all[recipeId] = [];
  all[recipeId].push(value);
  localStorage.setItem(KEYS.ratings, JSON.stringify(all));
}

export function getAverageRating(recipeId: string): { avg: number; count: number } {
  const ratings = getRatings(recipeId);
  if (!ratings.length) return { avg: 0, count: 0 };
  return {
    avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
    count: ratings.length,
  };
}

// Comments
export function getComments(recipeId: string): Comment[] {
  const data = localStorage.getItem(KEYS.comments);
  if (data) {
    try {
      const all = JSON.parse(data);
      if (typeof all === 'object' && all !== null) {
        return all[recipeId] || [];
      }
    } catch (e) { /* ignore */ }
  }
  return [];
}

export function addComment(recipeId: string, author: string, text: string): Comment {
  const data = localStorage.getItem(KEYS.comments);
  let all: Record<string, Comment[]> = {};
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (typeof parsed === 'object' && parsed !== null) {
        all = parsed;
      }
    } catch (e) { /* ignore */ }
  }

  if (!all[recipeId]) all[recipeId] = [];
  const comment: Comment = {
    id: crypto.randomUUID(),
    recipeId,
    author,
    text,
    createdAt: new Date().toISOString(),
  };
  all[recipeId].unshift(comment);
  localStorage.setItem(KEYS.comments, JSON.stringify(all));
  return comment;
}

// Helpers
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
