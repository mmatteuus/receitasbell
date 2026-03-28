import type { RecipeRecord } from "@/lib/recipes/types";
import { parseBRLInput } from "@/lib/helpers";
import type { AccessTier, ImageFileMeta, RecipeStatus } from "@/types/recipe";

export type EditorState = {
  id?: string;
  localDraftId?: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  imageFileMeta: ImageFileMeta | null;
  imagePreviewUrl: string;
  categorySlug: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: "Fácil" | "Médio" | "Difícil" | null;
  calories: number | null;
  videoUrl: string;
  accessTier: AccessTier;
  priceBRL: number | null;
  priceInput: string;
  ingredientsText: string;
  instructionsText: string;
  tagsText: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  isFeatured: boolean;
  status: RecipeStatus;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
};

export const EMPTY_STATE: EditorState = {
  title: "",
  slug: "",
  description: "",
  imageUrl: "",
  imageFileMeta: null,
  imagePreviewUrl: "",
  categorySlug: "",
  prepTime: 0,
  cookTime: 0,
  servings: 1,
  difficulty: null,
  calories: null,
  videoUrl: "",
  accessTier: "free",
  priceBRL: null,
  priceInput: "",
  ingredientsText: "",
  instructionsText: "",
  tagsText: "",
  excerpt: "",
  seoTitle: "",
  seoDescription: "",
  isFeatured: false,
  status: "draft",
};

export function parseLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getEditorErrors(form: EditorState) {
  const next: string[] = [];
  if (!form.title.trim()) next.push("Título é obrigatório");
  if (!form.categorySlug.trim()) next.push("Categoria é obrigatória");
  if (!form.imageUrl.trim()) next.push("Imagem é obrigatória");
  if (!parseLines(form.ingredientsText).length) next.push("Adicione pelo menos 1 ingrediente");
  if (!parseLines(form.instructionsText).length) next.push("Adicione pelo menos 1 passo");
  const parsedPrice = parseBRLInput(form.priceInput);
  if (form.accessTier === "paid" && (!parsedPrice || parsedPrice <= 0)) {
    next.push("Receita paga precisa de preço");
  }
  return next;
}

export type RecipeDraftInput = Partial<RecipeRecord> & {
  draftId?: string;
  serverRecipeId?: string | null;
};
