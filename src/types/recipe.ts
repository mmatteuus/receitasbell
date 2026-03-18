export type RecipeStatus = "draft" | "published";
export type AccessTier = "free" | "paid";
export type StorageProvider = "google_drive" | "fallback";

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

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt?: string | null;
  emoji?: string | null;
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

export interface Recipe {
  id: string;
  slug: string;
  title: string;
  description: string;
  image?: string; // legacy alias kept for existing consumers
  imageUrl?: string;
  imageFileMeta?: ImageFileMeta | null;

  categorySlug: string;
  tags: string[];
  status: RecipeStatus;

  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;

  accessTier: AccessTier;
  priceBRL?: number | null; // canonical value in reais

  fullIngredients: string[];
  fullInstructions: string[];
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  isFeatured?: boolean;
  createdByUserId?: string | null;
  ratingAvg?: number;
  ratingCount?: number;
  isUnlocked?: boolean;

  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

export interface CartItem {
  recipeId: string;
  title: string;
  slug: string;
  priceBRL: number;
  imageUrl: string;
}
