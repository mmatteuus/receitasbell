import type { ImageFileMeta } from '@/types/recipe';
import type { RecipeRecord } from '@/lib/recipes/types';
import {
  createRecipe,
  deleteRecipe as deleteRecipeRequest,
  getRecipeById as getRecipeByIdRequest,
  getRecipeBySlug as getRecipeBySlugRequest,
  listRecipes,
  type RecipeMutationPayload,
  updateRecipe as updateRecipeRequest,
} from '@/lib/api/recipes';
import { deleteRecipeImage, uploadRecipeImage } from '@/lib/api/uploads';
import { generateSlug } from '@/lib/helpers';
import { deriveRecipeTeaser } from '@/lib/utils/recipeAccess';

function toPayload(recipe: Partial<RecipeRecord>): RecipeMutationPayload {
  return {
    title: recipe.title || '',
    slug: recipe.slug,
    baseServerUpdatedAt: recipe.updatedAt ?? null,
    description: recipe.description || '',
    imageUrl: recipe.imageUrl || '',
    imageFileMeta: recipe.imageFileMeta ?? null,
    categorySlug: recipe.categorySlug || '',
    tags: recipe.tags || [],
    status: recipe.status || 'draft',
    prepTime: recipe.prepTime || 0,
    cookTime: recipe.cookTime || 0,
    servings: recipe.servings || 1,
    accessTier: recipe.accessTier || 'free',
    priceBRL: recipe.accessTier === 'paid' ? (recipe.priceBRL ?? 0) : null,
    fullIngredients: recipe.fullIngredients || [],
    fullInstructions: recipe.fullInstructions || [],
    publishedAt: recipe.publishedAt ?? null,
    createdAt: recipe.createdAt,
    createdByUserId: recipe.createdByUserId ?? null,
    excerpt: recipe.excerpt || '',
    seoTitle: recipe.seoTitle || '',
    seoDescription: recipe.seoDescription || '',
    isFeatured: recipe.isFeatured || false,
  };
}

export async function listAllAdmin() {
  return listRecipes({ includeDrafts: true });
}

export async function getRecipes() {
  return listAllAdmin();
}

export async function listPublished() {
  return listRecipes();
}

export async function getPublishedRecipes() {
  return listPublished();
}

export async function listPublicRecipes(
  params: {
    categorySlug?: string;
    q?: string;
    ids?: string[];
  } = {}
) {
  return listRecipes(params);
}

export async function getRecipeBySlug(slug: string) {
  return getRecipeBySlugRequest(slug);
}

export async function getRecipeById(id: string) {
  return getRecipeByIdRequest(id);
}

export async function getBySlug(slug: string) {
  return getRecipeBySlug(slug);
}

export async function getById(id: string) {
  return getRecipeById(id);
}

export async function create(recipe: Partial<RecipeRecord>) {
  return createRecipe(toPayload(recipe));
}

export async function update(id: string, patch: Partial<RecipeRecord>) {
  return updateRecipeRequest(id, toPayload(patch));
}

export async function saveRecipe(recipe: Partial<RecipeRecord> & { id?: string }) {
  if (recipe.id) {
    return update(recipe.id, recipe);
  }
  return create(recipe);
}

export async function deleteById(id: string) {
  return deleteRecipe(id);
}

export async function deleteRecipe(id: string) {
  await deleteRecipeRequest(id);
}

export async function uploadRecipeImageFile(file: File) {
  const dataBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  return uploadRecipeImage({
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    dataBase64,
  });
}

export async function removeRecipeImageFile(imageFileMeta?: ImageFileMeta | null) {
  // Baserow handles file cleanup internally when the row is deleted or the field is cleared.
  // This is a placeholder for external storage providers if added later.
}

export async function slugExists(slug: string, excludeId?: string) {
  const recipes = await listAllAdmin();
  return recipes.some((recipe) => recipe.slug === slug && recipe.id !== excludeId);
}

export function isSlugTaken(slug: string, recipes: RecipeRecord[], excludeId?: string) {
  return recipes.some((recipe) => recipe.slug === slug && recipe.id !== excludeId);
}

export function uniqueSlug(title: string, recipes: RecipeRecord[] = [], excludeId?: string) {
  const base = generateSlug(title) || 'receita';
  let slug = base;
  let suffix = 2;

  while (isSlugTaken(slug, recipes, excludeId)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export function getRecipeTeaser(recipe: Pick<RecipeRecord, 'fullIngredients' | 'fullInstructions'>) {
  return deriveRecipeTeaser(recipe);
}

export const recipeRepo = {
  listPublished,
  listAllAdmin,
  getBySlug,
  getById,
  create,
  update,
  delete: deleteById,
  slugExists,
};
