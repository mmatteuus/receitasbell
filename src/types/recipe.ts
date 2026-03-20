export type RecipeStatus = "draft" | "published";
export type AccessTier = "free" | "paid";
export type StorageProvider = "google_drive" | "fallback";

export type { Category } from "./category";
export type { CartItem } from "./cart";

export interface ImageFileMeta {
  storage: StorageProvider;
  fileId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  publicUrl: string;
  thumbnailUrl?: string | null;
  driveFolderId?: string | null;
}

export interface Recipe {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  categorySlug: string;
  prepTime: number | null;
  cookTime: number | null;
  totalTime: number | null;
  servings: number | null;
  difficulty?: "Fácil" | "Médio" | "Difícil" | null;
  calories?: number | null;
  videoUrl?: string | null;
  accessTier: AccessTier;
  priceBRL: number | null;
  fullIngredients: string[];
  fullInstructions: string[];
  status: RecipeStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface Comment {
  id: string;
  recipeId: string;
  userId?: string | null;
  author: string;
  authorEmail?: string;
  text: string;
  status?: string;
  createdAt: string;
}
