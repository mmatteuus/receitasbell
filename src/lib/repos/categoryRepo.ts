import {
  createCategory as createCategoryRequest,
  deleteCategory as deleteCategoryRequest,
  listCategories,
  updateCategory as updateCategoryRequest,
} from '@/lib/api/categories';
import { getRecipes } from '@/lib/repos/recipeRepo';

export async function list() {
  return listCategories();
}

export async function getCategoryById(id: string) {
  const categories = await list();
  return categories.find((category) => category.id === id);
}

export async function getCategoryBySlug(slug: string) {
  const categories = await list();
  return categories.find((category) => category.slug === slug);
}

export async function create(category: { name: string; description?: string; icon?: string }) {
  return createCategoryRequest(category);
}

export async function addCategory(cat: { name: string; description?: string; icon?: string }) {
  return create(cat);
}

export async function editCategory(
  id: string,
  cat: { name: string; description?: string; icon?: string }
) {
  return updateCategoryRequest(id, cat);
}

export async function remove(slug: string) {
  const category = await getCategoryBySlug(slug);
  if (!category) {
    return;
  }

  await deleteCategoryRequest(category.id);
}

export async function removeCategory(id: string) {
  await deleteCategoryRequest(id);
}

export async function hasRecipes(slug: string) {
  const recipes = await getRecipes();
  return recipes.some((recipe) => recipe.categorySlug === slug);
}

export async function getCategories() {
  return list();
}

export const categoryRepo = {
  list,
  create,
  remove,
  hasRecipes,
};
