import type { Category } from "@/types/category";
import { buildQuery, jsonFetch } from "./client";

export async function listCategories() {
  const result = await jsonFetch<{ categories?: Category[]; items?: Category[] }>("/api/public/categories");
  return result.categories ?? result.items ?? [];
}

export async function createCategory(input: { name: string; description?: string }) {
  const result = await jsonFetch<{ category?: Category; item?: Category }>("/api/admin/categories", {
    method: "POST",
    admin: true,
    body: input,
  });
  const category = result.category ?? result.item;
  if (!category) {
    throw new Error("Category response payload is missing.");
  }
  return category;
}

export async function updateCategory(id: string, input: { name: string; description?: string }) {
  const result = await jsonFetch<{ category?: Category; item?: Category }>(`/api/admin/categories${buildQuery({ id })}`, {
    method: "PUT",
    admin: true,
    body: input,
  });
  const category = result.category ?? result.item;
  if (!category) {
    throw new Error("Category response payload is missing.");
  }
  return category;
}

export async function deleteCategory(id: string) {
  await jsonFetch<void>(`/api/admin/categories${buildQuery({ id })}`, {
    method: "DELETE",
    admin: true,
  });
}
