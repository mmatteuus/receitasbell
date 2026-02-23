export interface Recipe {
  id: string;
  title: string;
  slug: string;
  description: string;
  categorySlug: string;
  image: string;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  ingredients: string[];
  steps: string[];
  tags: string[];
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface Comment {
  id: string;
  recipeId: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Category {
  name: string;
  slug: string;
  emoji: string;
  description: string;
}
