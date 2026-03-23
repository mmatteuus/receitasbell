import { fetchBaserow, BASEROW_TABLES } from "../../integrations/baserow/client.js";

export interface TenantRecord {
  id: string | number;
  slug: string;
  name: string;
  domain?: string;
  status: "active" | "inactive";
  createdAt: string;
}

export async function getTenantBySlug(slug: string): Promise<TenantRecord | null> {
  const data = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.TENANTS}/?user_field_names=true&filter__slug__equal=${slug}`
  );
  const record = data.results[0];
  if (!record) return null;
  return mapTenantRowToRecord(record);
}

export async function getTenantById(id: string | number): Promise<TenantRecord | null> {
  try {
    const record = await fetchBaserow<any>(`/api/database/rows/table/${BASEROW_TABLES.TENANTS}/${id}/?user_field_names=true`);
    return mapTenantRowToRecord(record);
  } catch { return null; }
}

function mapTenantRowToRecord(row: any): TenantRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    domain: row.domain || "",
    status: row.status === "active" ? "active" : "inactive",
    createdAt: row.created_at,
  };
}
