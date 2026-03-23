import { fetchBaserow, BASEROW_TABLES } from "../../integrations/baserow/client.js";
import { DEFAULT_CATEGORIES } from "../../../lib/defaults.js";

export interface Category {
  id: string | number;
  slug: string;
  name: string;
  description?: string;
  createdAt: string;
  tenantId: string | number;
}

export async function listCategories(tenantId: string | number): Promise<Category[]> {
  const data = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.CATEGORIES}/?user_field_names=true&filter__tenantId__equal=${tenantId}`
  );
  
  if (data.results.length === 0 && tenantId === "system") {
      return DEFAULT_CATEGORIES.map(c => ({ ...c, tenantId: "system" })) as Category[];
  }

  return data.results.map(record => mapCategoryRowToRecord(record));
}

export async function getCategoryBySlug(tenantId: string | number, slug: string): Promise<Category | null> {
  const data = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.CATEGORIES}/?user_field_names=true&filter__tenantId__equal=${tenantId}&filter__slug__equal=${slug}`
  );
  if (!data.results[0]) return null;
  return mapCategoryRowToRecord(data.results[0]);
}

export async function createCategory(tenantId: string | number, input: { name: string; slug: string; description?: string }): Promise<Category> {
  const record = await fetchBaserow<any>(`/api/database/rows/table/${BASEROW_TABLES.CATEGORIES}/?user_field_names=true`, {
      method: "POST",
      body: JSON.stringify({ ...input, tenantId: String(tenantId), created_at: new Date().toISOString() }),
  });
  return mapCategoryRowToRecord(record);
}

function mapCategoryRowToRecord(record: any): Category {
    return {
        id: record.id,
        slug: record.slug,
        name: record.name,
        description: record.description,
        createdAt: record.created_at,
        tenantId: record.tenantId,
    };
}
