import { createCategory as createCategoryRequest, listCategories } from "@/lib/api/categories";

export async function getCategories() {
  return listCategories();
}

export async function getCategoryBySlug(slug: string) {
  const categories = await getCategories();
  return categories.find((category) => category.slug === slug);
}

export async function addCategory(cat: { name: string; emoji?: string; description?: string }) {
  return createCategoryRequest(cat);
}

export async function removeCategory() {
  throw new Error("Category removal is not implemented in this migration.");
}
