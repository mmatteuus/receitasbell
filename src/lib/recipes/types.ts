import type { ImageFileMeta, Recipe } from "../../types/recipe.js";

export interface RecipeRecord extends Recipe {
  imageFileMeta?: ImageFileMeta | null;
  tags: string[];
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  isFeatured?: boolean;
  createdByUserId?: string | null;
  ratingAvg?: number;
  ratingCount?: number;
  hasAccess?: boolean;
}
