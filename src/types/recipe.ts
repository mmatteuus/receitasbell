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
  author: string;
  text: string;
  createdAt: string;
}

export interface Recipe {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string; // URL or base64 data URL

  categorySlug: string;
  tags: string[];
  status: RecipeStatus;

  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;

  accessTier: AccessTier;
  priceBRL?: number; // e.g. 9.90

  ingredients: string[];
  instructions: string[];

  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}
