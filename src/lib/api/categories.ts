import type { Category } from "@/types/recipe";
import { jsonFetch } from "./client";

export async function listCategories() {
  const result = await jsonFetch<{ categories: Category[] }>("/api/categories");
  return result.categories;
}

export async function createCategory(input: { name: string; emoji?: string; description?: string }) {
  const result = await jsonFetch<{ category: Category }>("/api/categories", {
    method: "POST",
    admin: true,
    body: input,
  });
  return result.category;
}

export async function updateCategory(id: string, input: { name: string; emoji?: string; description?: string }) {
  const result = await jsonFetch<{ category: Category }>(`/api/categories/${encodeURIComponent(id)}`, {
    method: "PUT",
    admin: true,
    body: input,
  });
  return result.category;
}

export async function deleteCategory(id: string) {
  await jsonFetch<void>(`/api/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
    admin: true,
  });
}
