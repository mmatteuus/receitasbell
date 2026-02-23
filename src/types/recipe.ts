export type AccessTier = 'free' | 'paid';

export interface Recipe {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  accessTier: AccessTier;
  priceCents?: number;
  teaserIngredients: string[];
  teaserInstructions: string[];
  fullIngredients: string[];
  fullInstructions: string[];
  category: string;
}