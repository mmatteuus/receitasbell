import { fetchBaserow } from "../integrations/baserow/client.js";
import { BASEROW_TABLES } from "../integrations/baserow/tables.js";

type TenantRow = {
  id?: string | number;
  slug?: string;
  name?: string;
  host?: string | null;
  domain?: string | null;
  Active?: boolean;
  status?: string;
  created_at?: string;
};

export interface TenantRecord {
  id: string | number;
  slug: string;
  name: string;
  host?: string;
  status: "active" | "inactive";
  createdAt: string;
}

export async function getTenantBySlug(slug: string): Promise<TenantRecord | null> {
  const data = await fetchBaserow<{ results: TenantRow[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.TENANTS}/?user_field_names=true&filter__slug__equal=${slug}`
  );
  const record = data.results[0];
  if (!record) return null;
  return mapTenantRowToRecord(record);
}

export async function getTenantById(id: string | number): Promise<TenantRecord | null> {
  try {
    const record = await fetchBaserow<TenantRow>(`/api/database/rows/table/${BASEROW_TABLES.TENANTS}/${id}/?user_field_names=true`);
    return mapTenantRowToRecord(record);
  } catch { return null; }
}

export async function getTenantByHost(host: string): Promise<TenantRecord | null> {
  const normalized = host.trim().toLowerCase().replace(/:\d+$/, "");
  const data = await fetchBaserow<{ results: TenantRow[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.TENANTS}/?user_field_names=true&filter__host__equal=${encodeURIComponent(normalized)}`
  );
  const record = data.results[0];
  if (!record) return null;
  return mapTenantRowToRecord(record);
}

export async function listActiveTenants(): Promise<TenantRecord[]> {
  const data = await fetchBaserow<{ results: TenantRow[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.TENANTS}/?user_field_names=true&size=200`
  );
  return data.results.map(mapTenantRowToRecord).filter((tenant) => tenant.status === "active");
}

export async function countTenants(): Promise<number> {
  const data = await fetchBaserow<{ count: number }>(`/api/database/rows/table/${BASEROW_TABLES.TENANTS}/?user_field_names=true&size=1`);
  return data.count;
}

export async function createTenant(input: {
  slug: string;
  name: string;
  host?: string | null;
}) {
  const record = await fetchBaserow<TenantRow>(
    `/api/database/rows/table/${BASEROW_TABLES.TENANTS}/?user_field_names=true`,
    {
      method: "POST",
      body: JSON.stringify({
        slug: input.slug,
        name: input.name,
        host: input.host || "",
        Active: true,
        created_at: new Date().toISOString(),
      }),
    },
  );

  return mapTenantRowToRecord(record);
}

function mapTenantRowToRecord(row: TenantRow): TenantRecord {
  return {
    id: row.id ?? "",
    slug: row.slug ?? "",
    name: row.name ?? "",
    host: row.host || row.domain || "",
    status: row.Active === false || row.status === "inactive" ? "inactive" : "active",
    createdAt: row.created_at ?? "",
  };
}
