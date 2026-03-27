import { fetchBaserow } from "../integrations/baserow/client.js";
import { BASEROW_TABLES } from "../integrations/baserow/tables.js";
import { DEFAULT_CATEGORIES } from "../../lib/defaults.js";

type CategoryRow = {
  id?: string | number;
  slug?: string;
  name?: string;
  description?: string | null;
  created_at?: string;
  tenantId?: string | number;
};

export interface Category {
  id: string | number;
  slug: string;
  name: string;
  description?: string;
  createdAt: string;
  tenantId: string | number;
}

export async function listCategories(tenantId: string | number): Promise<Category[]> {
  const data = await fetchBaserow<{ results: CategoryRow[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.CATEGORIES}/?user_field_names=true&filter__tenantId__equal=${tenantId}`
  );
  
  if (data.results.length === 0 && tenantId === "system") {
      return DEFAULT_CATEGORIES.map(c => ({ ...c, tenantId: "system" })) as Category[];
  }

  return data.results.map(record => mapCategoryRowToRecord(record));
}

export async function getCategoryBySlug(tenantId: string | number, slug: string): Promise<Category | null> {
  const data = await fetchBaserow<{ results: CategoryRow[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.CATEGORIES}/?user_field_names=true&filter__tenantId__equal=${tenantId}&filter__slug__equal=${slug}`
  );
  if (!data.results[0]) return null;
  return mapCategoryRowToRecord(data.results[0]);
}

export async function createCategory(tenantId: string | number, input: { name: string; slug: string; description?: string }): Promise<Category> {
  const record = await fetchBaserow<CategoryRow>(`/api/database/rows/table/${BASEROW_TABLES.CATEGORIES}/?user_field_names=true`, {
      method: "POST",
      body: JSON.stringify({ ...input, tenantId: String(tenantId), created_at: new Date().toISOString() }),
  });
  return mapCategoryRowToRecord(record);
}

export async function updateCategory(tenantId: string | number, id: string | number, input: Partial<{ name: string; slug: string; description: string }>): Promise<Category> {
    // Security check: verify ownership
    const existing = await fetchBaserow<CategoryRow>(`/api/database/rows/table/${BASEROW_TABLES.CATEGORIES}/${id}/?user_field_names=true`);
    if (String(existing.tenantId) !== String(tenantId)) {
        throw new Error("Category not found or does not belong to this tenant");
    }

    const record = await fetchBaserow<CategoryRow>(`/api/database/rows/table/${BASEROW_TABLES.CATEGORIES}/${id}/?user_field_names=true`, {
        method: "PATCH",
        body: JSON.stringify(input),
    });
    return mapCategoryRowToRecord(record);
}

export async function deleteCategory(tenantId: string | number, id: string | number): Promise<void> {
    // Security check: verify ownership
    const existing = await fetchBaserow<CategoryRow>(`/api/database/rows/table/${BASEROW_TABLES.CATEGORIES}/${id}/?user_field_names=true`);
    if (String(existing.tenantId) !== String(tenantId)) {
        throw new Error("Category not found or does not belong to this tenant");
    }

    await fetchBaserow(`/api/database/rows/table/${BASEROW_TABLES.CATEGORIES}/${id}/`, { method: "DELETE" });
}

function mapCategoryRowToRecord(record: CategoryRow): Category {
    return {
        id: record.id ?? "",
        slug: record.slug ?? "",
        name: record.name ?? "",
        description: record.description ?? "",
        createdAt: record.created_at ?? "",
        tenantId: record.tenantId ?? "",
    };
}
