export type RecipeStatus = 'draft' | 'published';
export type AccessTier = 'free' | 'paid';

export interface Category {
  name: string;
  slug: string;
  emoji: string;
  description: string;
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
  image?: string; // compatible fallback for legacy consumers
  imageUrl?: string;

  categorySlug: string;
  tags: string[];
  status: RecipeStatus;

  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;

  accessTier: AccessTier;
  priceBRL?: number; // e.g. 9.90

  fullIngredients: string[];
  fullInstructions: string[];
  excerpt?: string;
  cardTitle?: string;
  cardSubtitle?: string;
  marketingHeadline?: string;
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
