import {
  createCategory as createCategoryRequest,
  deleteCategory as deleteCategoryRequest,
  listCategories,
  updateCategory as updateCategoryRequest,
} from "@/lib/api/categories";

export async function getCategories() {
  return listCategories();
}

export async function getCategoryById(id: string) {
  const categories = await getCategories();
  return categories.find((category) => category.id === id);
}

export async function getCategoryBySlug(slug: string) {
  const categories = await getCategories();
  return categories.find((category) => category.slug === slug);
}

export async function addCategory(cat: { name: string; emoji?: string; description?: string }) {
  return createCategoryRequest(cat);
}

export async function editCategory(id: string, cat: { name: string; emoji?: string; description?: string }) {
  return updateCategoryRequest(id, cat);
}

export async function removeCategory(id: string) {
  return deleteCategoryRequest(id);
}
