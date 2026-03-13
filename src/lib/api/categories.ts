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

