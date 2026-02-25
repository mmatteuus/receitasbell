export type RecipeStatus = 'draft' | 'published' | 'archived';
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
  image: string;
  
  // Metadata
  categorySlug: string;
  tags: string[];
  status: RecipeStatus;
  
  // Time & Servings
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  rating?: number;
  reviewsCount?: number;

  // Monetization
  accessTier: AccessTier;
  priceCents?: number;
  currency?: string;

  // Content
  ingredients: string[];
  instructions: string[];
  
  teaserIngredients?: string[];
  teaserInstructions?: string[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}