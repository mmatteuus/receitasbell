import { Comment } from "@/types/recipe";
import { generateSlug, formatBRL } from "@/lib/helpers";
export * from "@/lib/repos/recipeRepo";
export { generateSlug, formatBRL };

const KEYS = {
  favorites: "rdb_favs_v1",
  comments: "rdb_comments_v1",
  ratings: "rdb_ratings_v1",
};

// Favorites
export function getFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.favorites) || "[]");
  } catch {
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
  try {
    const all = JSON.parse(localStorage.getItem(KEYS.ratings) || "{}");
    return all[recipeId] || [];
  } catch {
    return [];
  }
}

export function addRating(recipeId: string, value: number) {
  let all: Record<string, number[]> = {};
  try {
    all = JSON.parse(localStorage.getItem(KEYS.ratings) || "{}");
  } catch {
    /* ignore */
  }
  if (!all[recipeId]) all[recipeId] = [];
  all[recipeId].push(value);
  localStorage.setItem(KEYS.ratings, JSON.stringify(all));
}

export function getAverageRating(recipeId: string) {
  const ratings = getRatings(recipeId);
  if (!ratings.length) return { avg: 0, count: 0 };
  return { avg: ratings.reduce((a, b) => a + b, 0) / ratings.length, count: ratings.length };
}

// Comments
export function getComments(recipeId: string): Comment[] {
  try {
    const all = JSON.parse(localStorage.getItem(KEYS.comments) || "{}");
    return all[recipeId] || [];
  } catch {
    return [];
  }
}

export function addComment(recipeId: string, author: string, text: string): Comment {
  let all: Record<string, Comment[]> = {};
  try {
    all = JSON.parse(localStorage.getItem(KEYS.comments) || "{}");
  } catch {
    /* ignore */
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
